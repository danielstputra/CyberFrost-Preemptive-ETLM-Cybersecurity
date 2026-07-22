/**
 * OSINT Scanner — Real Data Sources + Typosquatting + Dev Mock Data
 * ===================================================================
 * Fetches real OSINT data from public APIs:
 *   - crt.sh (Certificate Transparency) — subdomain enumeration
 *   - HIBP (Have I Been Pwned) — breach data (requires API key)
 *
 * Plus built-in intelligence:
 *   - Typosquatting detection — generates lookalike domains & checks DNS
 *   - Dev mock data — fills UI when no real sources are available
 */

import { Resolver } from 'dns/promises';
import { DarkWebLeak } from '../models/DarkWebLeak';
import { BrandExposure } from '../models/BrandExposure';

const CRT_SH_URL = 'https://crt.sh/?q=%25.{domain}&output=json';
const HIBP_API = 'https://haveibeenpwned.com/api/v3/breaches';

// ── Scanner Types ──

export interface OsintScanOptions {
  target: string;
  targetDomain?: string;
  scanType: 'DOMAIN' | 'COMPANY' | 'KEYWORD' | 'DARKWEB';
  tenantId: string;
  userId: string;
  osintJobId: string;
  onProgress: (percent: number, message?: string) => Promise<void>;
}

export interface OsintScanResult {
  leaksCreated: number;
  exposuresCreated: number;
  summary: {
    totalLeaks: number;
    totalExposures: number;
  };
}

// ── Helpers ──

function extractDomain(target: string): string {
  if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9][a-z0-9-]*[a-z0-9])+$/i.test(target)) {
    return target;
  }
  return `${target.toLowerCase().replace(/\s+/g, '')}.com`;
}

// ── crt.sh Certificate Transparency ──

async function fetchCrtShData(domain: string): Promise<string[]> {
  const url = CRT_SH_URL.replace('{domain}', encodeURIComponent(domain));
  const subdomains = new Set<string>();

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];

    const data = (await res.json()) as { name_value: string }[];
    for (const entry of data) {
      const names = entry.name_value.split('\n');
      for (const name of names) {
        const clean = name.trim().toLowerCase();
        if (clean.endsWith(domain) && clean !== domain && !clean.startsWith('*')) {
          subdomains.add(clean);
        }
      }
    }
  } catch {
    // crt.sh might be unreachable
  }

  return Array.from(subdomains).slice(0, 50);
}

// ── Fast DNS resolution with 3s timeout ──

const _dnsResolver = new Resolver();
_dnsResolver.setServers(['8.8.8.8', '1.1.1.1', '208.67.222.222']);

async function resolveDomain(domain: string): Promise<string | null> {
  try {
    const records = await Promise.race([
      _dnsResolver.resolve4(domain),
      new Promise<string[]>((_, reject) => setTimeout(() => reject(new Error('DNS timeout')), 3000)),
    ]) as string[];
    return records[0] || null;
  } catch {
    return null;
  }
}

async function resolveDomainsConcurrent(domains: string[]): Promise<string[]> {
  const results = await Promise.allSettled(domains.map(d => resolveDomain(d)));
  return domains.filter((_, i) => results[i].status === 'fulfilled' && results[i].value !== null);
}

// ── Typosquatting Generator ──

const COMMON_TLDS = ['com', 'co', 'org', 'net', 'io', 'co.id', 'or.id', 'ac.id', 'info', 'biz'];

/**
 * Generate common typosquat domain variants from a legitimate domain.
 * Includes: character omission, duplication, adjacent-key swaps, and TLD swaps.
 */
function generateTyposquatDomains(domain: string): string[] {
  const parts = domain.split('.');
  const tld = parts.pop()!;
  const base = parts.join('.');
  if (!base) return [];

  const variants = new Set<string>();

  // 1. Character omission (remove one char)
  for (let i = 0; i < base.length; i++) {
    variants.add(`${base.slice(0, i)}${base.slice(i + 1)}.${tld}`);
  }

  // 2. Character duplication
  for (let i = 0; i < base.length; i++) {
    variants.add(`${base.slice(0, i)}${base[i]}${base[i]}${base.slice(i + 1)}.${tld}`);
  }

  // 3. Adjacent-key typos (QWERTY common swaps)
  const swaps: Record<string, string[]> = {
    'g': ['h', 'f'], 'o': ['i', 'p'], 'l': ['k'], 'e': ['r', 'w'],
    'a': ['s'], 't': ['y', 'r'], 'c': ['v'], 'i': ['o', 'u'],
    'm': ['n'], 'n': ['m', 'b'], 's': ['a', 'd'], 'r': ['e', 't'],
    'u': ['i', 'y'], 'd': ['s', 'f'], 'y': ['t', 'u'],
  };
  for (let i = 0; i < base.length; i++) {
    const ch = base[i];
    const adjacent = swaps[ch];
    if (adjacent) {
      for (const a of adjacent) {
        variants.add(`${base.slice(0, i)}${a}${base.slice(i + 1)}.${tld}`);
      }
    }
  }

  // 4. Common TLD substitutions
  for (const alt of COMMON_TLDS) {
    if (alt !== tld) {
      variants.add(`${base}.${alt}`);
    }
  }

  // 5. Hyphenation: insert hyphen in the middle
  const mid = Math.floor(base.length / 2);
  if (base.length > 3) {
    variants.add(`${base.slice(0, mid)}-${base.slice(mid)}.${tld}`);
  }

  return Array.from(variants).slice(0, 25);
}

// ── HIBP Breach Check ──

async function checkHibpBreaches(domain: string, tenantId: string, osintJobId: string): Promise<number> {
  let created = 0;

  try {
    const res = await fetch(`${HIBP_API}?domain=${domain}`, {
      headers: { 'User-Agent': 'CyberFrost-OSINT/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 401) {
      console.warn('[OSINT] HIBP API key required — skipping HIBP breach check');
      return 0;
    }

    if (res.ok) {
      const breaches = (await res.json()) as any[];
      for (const breach of breaches.slice(0, 10)) {
        const title = breach.Title || `${domain} — Data Breach`;
        const exists = await DarkWebLeak.findOne({ domain, title, tenantId });
        if (exists) continue;

        await DarkWebLeak.create({
          title,
          source: 'haveibeenpwned.com',
          sourceUrl: `https://haveibeenpwned.com/breaches/${breach.Name || ''}`,
          domain,
          leakType: 'CREDENTIAL_DUMP',
          content: `${breach.Description || ''}\nBreach date: ${breach.BreachDate || ''}\nCompromised data: ${(breach.DataClasses as string[])?.join(', ') || ''}`,
          snippet: `Compromised data: ${(breach.DataClasses as string[])?.join(', ') || ''}`,
          severity: 'HIGH',
          status: 'NEW',
          leakedCredentials: breach.DataClasses?.includes?.('Passwords') || breach.DataClasses?.includes?.('Email addresses') || false,
          emailsFound: [],
          passwordsFound: breach.DataClasses?.includes?.('Passwords') || false,
          emailsInvolved: breach.PwnCount || 0,
          discoveredAt: new Date(breach.BreachDate || Date.now()),
          osintJobId,
          tenantId,
          metadata: {},
        } as any);
        created++;
      }
      console.log(`[OSINT] HIBP: created ${created} leak(s) for ${domain}`);
    }
  } catch {
    console.warn('[OSINT] HIBP unreachable — skipping');
  }

  return created;
}

// ── Typosquatting Scanner ──

async function scanTyposquatting(
  domain: string,
  brandName: string,
  tenantId: string,
  osintJobId: string,
): Promise<number> {
  const variants = generateTyposquatDomains(domain);

  console.log(`[OSINT] Typosquatting: checking ${variants.length} variants for ${domain}`);

  // Concurrent DNS — all 25 variants resolve in parallel with 3s timeout each
  const resolved = await resolveDomainsConcurrent(variants);
  if (resolved.length === 0) {
    console.log(`[OSINT] Typosquatting: no live variants found for ${domain}`);
    return 0;
  }

  // Batch check which ones already exist in DB
  const existing = await BrandExposure.find({ domain: { $in: resolved }, tenantId }).select('domain').lean();
  const existingSet = new Set(existing.map(e => e.domain));
  const newDomains = resolved.filter(d => !existingSet.has(d));

  if (newDomains.length === 0) {
    console.log(`[OSINT] Typosquatting: ${resolved.length} found, all already tracked`);
    return 0;
  }

  // Bulk insert
  const docs = newDomains.map(variant => ({
    brandName,
    domain: variant,
    exposureType: 'TYPOSQUATTING' as const,
    severity: 'MEDIUM' as const,
    status: 'NEW' as const,
    url: `http://${variant}`,
    description: `Typosquat domain: ${variant} — resembles ${domain}`,
    discoveredAt: new Date(),
    osintJobId,
    tenantId,
  }));

  await BrandExposure.insertMany(docs);
  console.log(`[OSINT] Typosquatting: created ${docs.length} exposure(s) for ${domain}`);
  return docs.length;
}

// ── Main Scanner ──

export async function runOsintScan(options: OsintScanOptions): Promise<OsintScanResult> {
  const { target, tenantId, osintJobId, onProgress } = options;
  const domain = options.targetDomain || extractDomain(target);
  const brandName = target.replace(/\.[^.]+$/, ''); // "example.com" → "example"

  let totalLeaks = 0;
  let totalExposures = 0;

  // ── Phase 1: crt.sh Certificate Transparency (0% → 25%) ──
  await onProgress(5, 'Fetching certificate transparency logs from crt.sh...');
  const subdomains = await fetchCrtShData(domain);
  console.log(`[OSINT] crt.sh: found ${subdomains.length} subdomains for ${domain}`);

  // Resolve subdomains for intelligence (DNS check)
  for (const sub of subdomains.slice(0, 15)) {
    await resolveDomain(sub);
  }
  await onProgress(20, `Discovered ${subdomains.length} subdomains via certificate logs`);

  // Don't save subdomains as exposures (they're legitimate infrastructure),
  // but log them for reconnaissance value.

  // ── Phase 2: Typosquatting Detection (25% → 45%) ──
  await onProgress(25, 'Scanning for typosquatting and lookalike domains...');
  const typosquatCount = await scanTyposquatting(domain, brandName, tenantId, osintJobId);
  totalExposures += typosquatCount;
  await onProgress(40, `Found ${typosquatCount} typosquat domain(s)`);

  // ── Phase 3: HIBP Breach Check (45% → 65%) ──
  await onProgress(45, 'Checking Have I Been Pwned for known breaches...');
  const hibpCount = await checkHibpBreaches(domain, tenantId, osintJobId);
  totalLeaks += hibpCount;
  await onProgress(60, `Found ${hibpCount} known breach(es)`);

  // ── Phase 4: DNS Infrastructure Scan (65% → 80%) ──
  await onProgress(65, 'Resolving domain infrastructure...');
  const commonSubs = ['www', 'mail', 'api', 'admin', 'blog', 'vpn', 'remote', 'cpanel', 'webmail'];
  const subDomains = commonSubs.map(s => `${s}.${domain}`);
  const resolved = await resolveDomainsConcurrent(subDomains);
  console.log(`[OSINT] DNS: resolved ${resolved.length}/${commonSubs.length} common subdomains for ${domain}`);
  await onProgress(75, 'Domain infrastructure scan complete');

  // ── Phase 5: Finalize (80% → 100%) ──
  await onProgress(95, 'Compiling OSINT report...');

  // Update the scan job with final counts
  const { OsintScanJob } = await import('../models/OsintScanJob');
  await OsintScanJob.findByIdAndUpdate(osintJobId, {
    leaksFound: totalLeaks,
    exposuresFound: totalExposures,
  });

  const result: OsintScanResult = {
    leaksCreated: totalLeaks,
    exposuresCreated: totalExposures,
    summary: { totalLeaks, totalExposures },
  };

  await onProgress(100, `OSINT scan complete — ${totalLeaks} leak(s), ${totalExposures} exposure(s)`);

  if (totalLeaks === 0 && totalExposures === 0) {
    console.log(`[OSINT] No findings for ${domain}. All data sources returned empty.`);
  }

  return result;
}
