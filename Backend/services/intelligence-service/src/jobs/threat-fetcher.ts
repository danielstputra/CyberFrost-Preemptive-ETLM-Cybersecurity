/**
 * Threat Fetcher — Real Data from NVD & CISA APIs
 * =================================================
 * Fetches real CVE vulnerabilities from the National Vulnerability Database (NVD)
 * and Known Exploited Vulnerabilities from CISA.
 *
 * Runs on a configurable interval (default: every 6 hours).
 * Respects NVD rate limits (5 requests per 30s without API key).
 *
 * NVD API: https://services.nvd.nist.gov/rest/json/cves/2.0
 * CISA KEV: https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json
 */

import cron from 'node-cron';
import { config } from '../config';
import { Vulnerability } from '../models/Vulnerability';

const NVD_BASE_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const CISA_KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

interface NvdCveObject {
  id: string;
  published: string;
  lastModified: string;
  descriptions: { lang: string; value: string }[];
  metrics: {
    cvssMetricV31?: { cvssData: { baseScore: number; vectorString: string } }[];
    cvssMetricV30?: { cvssData: { baseScore: number; vectorString: string } }[];
    cvssMetricV2?: { cvssData: { baseScore: number; vectorString: string } }[];
  };
  weaknesses: { description: { value: string }[] }[];
  configurations: any[];
  references: { source: string; tags: string[]; url: string }[];
}

interface NvdApiItem {
  cve: NvdCveObject;
}

function severityFromScore(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score >= 9.0) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 4.0) return 'MEDIUM';
  return 'LOW';
}

async function fetchFromNvd(): Promise<number> {
  // Fetch CVEs published in the last 24 hours
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    pubStartDate: startDate.toISOString(),
    pubEndDate: endDate.toISOString(),
    resultsPerPage: '20',
  });

  const url = `${NVD_BASE_URL}?${params}`;
  console.log(`[Intel-Cron] Fetching real CVEs from NVD API...`);

  let inserted = 0;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CyberFrost-Platform/1.0' },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.warn(`[Intel-Cron] NVD API returned ${res.status}. Will retry next cycle.`);
      return 0;
    }

    const data = await res.json() as { vulnerabilities: NvdApiItem[] };
    if (!data.vulnerabilities?.length) {
      console.log(`[Intel-Cron] No new CVEs from NVD in the last 24 hours.`);
      return 0;
    }

    for (const item of data.vulnerabilities) {
      const cve = item.cve;
      const cveId = cve.id;
      const exists = await Vulnerability.findOne({ cveId });
      if (exists) continue;

      const description = cve.descriptions?.find(d => d.lang === 'en')?.value || '';
      const cvssData = cve.metrics?.cvssMetricV31?.[0]?.cvssData
        || cve.metrics?.cvssMetricV30?.[0]?.cvssData
        || cve.metrics?.cvssMetricV2?.[0]?.cvssData;
      const score = cvssData?.baseScore || 0;
      const vector = cvssData?.vectorString || '';
      const references = (cve.references || []).map(r => r.url);

      // Extract affected products from CPE configurations
      const affectedProducts: string[] = [];
      if (cve.configurations?.length) {
        for (const config of cve.configurations) {
          for (const node of config.nodes || []) {
            for (const match of node.cpeMatch || []) {
              const parts = match.criteria?.split(':') || [];
              const product = parts[4] || '';
              if (product && !affectedProducts.includes(product)) {
                affectedProducts.push(product);
              }
            }
          }
        }
      }

      await Vulnerability.create({
        cveId,
        title: description.split('.')[0] || cveId,
        description,
        cvss: { score, vector },
        severity: severityFromScore(score),
        affectedProducts,
        exploitAvailable: false,
        publishedAt: new Date(cve.published),
        lastModifiedAt: new Date(cve.lastModified),
        source: 'NVD',
        references,
        tags: [],
        status: 'NEW',
        tenantId: 'default',
      });
      inserted++;
    }

    console.log(`[Intel-Cron] Inserted ${inserted} real CVEs from NVD`);
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
      console.warn('[Intel-Cron] NVD API timeout. Will retry next cycle.');
    } else {
      console.error('[Intel-Cron] NVD API error:', err.message);
    }
  }

  return inserted;
}

async function fetchFromCisaKev(): Promise<number> {
  console.log(`[Intel-Cron] Fetching real KEV catalog from CISA...`);

  let inserted = 0;
  try {
    const res = await fetch(CISA_KEV_URL, {
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn(`[Intel-Cron] CISA KEV returned ${res.status}`);
      return 0;
    }

    const data = await res.json() as { vulnerabilities: any[] };
    if (!data.vulnerabilities?.length) return 0;

    // Only process the most recent 10 KEV entries
    const recent = data.vulnerabilities.slice(-10);

    for (const vuln of recent) {
      const cveId = vuln.cveID;
      const exists = await Vulnerability.findOne({ cveId });
      if (exists) {
        // Mark as exploit available if not already
        await Vulnerability.updateOne({ cveId }, { $set: { exploitAvailable: true } });
        continue;
      }

      await Vulnerability.create({
        cveId,
        title: vuln.vulnerabilityName || cveId,
        description: vuln.shortDescription || '',
        cvss: { score: 0, vector: '' },
        severity: 'HIGH',
        affectedProducts: [vuln.product || ''],
        exploitAvailable: true,
        exploitDetails: `Known exploited vulnerability. Vendor: ${vuln.vendorProject}, Product: ${vuln.product}`,
        publishedAt: new Date(vuln.dateAdded || Date.now()),
        lastModifiedAt: new Date(vuln.dateAdded || Date.now()),
        source: 'CISA-KEV',
        references: [vuln.url || ''],
        tags: ['cisa-kev', 'known-exploit'],
        status: 'NEW',
        tenantId: 'default',
      });
      inserted++;
    }

    console.log(`[Intel-Cron] Processed ${inserted} new KEV entries from CISA`);
  } catch (err: any) {
    if (err.name === 'TimeoutError') {
      console.warn('[Intel-Cron] CISA KEV timeout. Will retry next cycle.');
    } else {
      console.error('[Intel-Cron] CISA KEV error:', err.message);
    }
  }

  return inserted;
}

let cronTask: cron.ScheduledTask | null = null;

export function startThreatFetcher(): void {
  // Default: every 6 hours. For dev/testing, you can set INTEL_CRON_INTERVAL=*/5 * * * *
  const interval = config.cron.fetchInterval;

  console.log(`[Intel-Cron] Starting real threat fetcher (interval: "${interval}")`);

  cronTask = cron.schedule(interval, async () => {
    console.log(`[Intel-Cron] Tick — fetching real threat data...`);
    await fetchFromNvd();
    await fetchFromCisaKev();
  });

  // Run initial fetch immediately on startup
  console.log('[Intel-Cron] Running initial fetch...');
  setTimeout(() => {
    cronTask?.now();
  }, 5000);
}

export function stopThreatFetcher(): void {
  if (cronTask) {
    cronTask.stop();
    console.log('[Intel-Cron] Stopped.');
  }
}
