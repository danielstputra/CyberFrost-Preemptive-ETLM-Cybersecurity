import { promises as dns } from 'dns';
import { Socket } from 'net';
import * as tls from 'tls';
import { DiscoveredDomain, IPortInfo, ITechnology } from '../models/DiscoveredDomain';
import { ShadowItAsset } from '../models/ShadowItAsset';

// ════════════════════════════════════════════════════
//  Constants
// ════════════════════════════════════════════════════

const COMMON_SUBDOMAINS = [
  'www', 'mail', 'api', 'admin', 'blog', 'dev', 'staging', 'test',
  'app', 'cdn', 'static', 'assets', 'images', 'docs', 'help', 'support',
  'shop', 'store', 'portal', 'login', 'sso', 'auth', 'webmail',
  'remote', 'git', 'jenkins', 'jira', 'confluence', 'wiki', 'status',
  'mx', 'pop', 'smtp', 'imap', 'calendar', 'drive', 'cloud', 'forum',
  'community', 'partner', 'partners', 'sales', 'marketing', 'careers',
  'grafana', 'prometheus', 'kibana', 'monitor', 'monitoring',
];

const COMMON_PORTS: Array<{ port: number; service: string; protocol: 'TCP' | 'UDP' }> = [
  { port: 21, service: 'FTP', protocol: 'TCP' },
  { port: 22, service: 'SSH', protocol: 'TCP' },
  { port: 23, service: 'Telnet', protocol: 'TCP' },
  { port: 25, service: 'SMTP', protocol: 'TCP' },
  { port: 53, service: 'DNS', protocol: 'UDP' },
  { port: 80, service: 'HTTP', protocol: 'TCP' },
  { port: 110, service: 'POP3', protocol: 'TCP' },
  { port: 143, service: 'IMAP', protocol: 'TCP' },
  { port: 443, service: 'HTTPS', protocol: 'TCP' },
  { port: 465, service: 'SMTPS', protocol: 'TCP' },
  { port: 587, service: 'SMTP-Submission', protocol: 'TCP' },
  { port: 993, service: 'IMAPS', protocol: 'TCP' },
  { port: 995, service: 'POP3S', protocol: 'TCP' },
  { port: 1433, service: 'MSSQL', protocol: 'TCP' },
  { port: 2082, service: 'cPanel', protocol: 'TCP' },
  { port: 2083, service: 'cPanel-SSL', protocol: 'TCP' },
  { port: 3306, service: 'MySQL', protocol: 'TCP' },
  { port: 3389, service: 'RDP', protocol: 'TCP' },
  { port: 5432, service: 'PostgreSQL', protocol: 'TCP' },
  { port: 6379, service: 'Redis', protocol: 'TCP' },
  { port: 8080, service: 'HTTP-Alt', protocol: 'TCP' },
  { port: 8443, service: 'HTTPS-Alt', protocol: 'TCP' },
  { port: 9090, service: 'Prometheus', protocol: 'TCP' },
  { port: 27017, service: 'MongoDB', protocol: 'TCP' },
];

const WEB_TECHNOLOGIES: Array<{ name: string; category: ITechnology['category']; ports: number[] }> = [
  { name: 'Nginx', category: 'WEB_SERVER', ports: [80, 443, 8080, 8443] },
  { name: 'Apache', category: 'WEB_SERVER', ports: [80, 443, 8080] },
  { name: 'Cloudflare', category: 'CDN', ports: [80, 443] },
  { name: 'CloudFront', category: 'CDN', ports: [80, 443] },
  { name: 'React', category: 'FRAMEWORK', ports: [80, 443, 3000] },
  { name: 'Next.js', category: 'FRAMEWORK', ports: [80, 443] },
  { name: 'WordPress', category: 'FRAMEWORK', ports: [80, 443] },
  { name: 'Node.js/Express', category: 'FRAMEWORK', ports: [3000, 8080] },
  { name: 'Django/Python', category: 'FRAMEWORK', ports: [80, 443, 8000] },
  { name: 'Tomcat/Java', category: 'FRAMEWORK', ports: [8080, 8443] },
  { name: 'IIS', category: 'WEB_SERVER', ports: [80, 443] },
  { name: 'Google Analytics', category: 'ANALYTICS', ports: [80, 443] },
];

/**
 * Ports commonly used by unmanaged / shadow IT services
 * that may indicate unapproved deployments.
 */
const SHADOW_IT_PORTS = [3000, 5000, 8000, 8080, 8888, 9000, 9090, 3001, 4200, 5001];

/**
 * SSL expiry warning thresholds (days)
 */
const SSL_WARN_DAYS = 30;

// ════════════════════════════════════════════════════
//  Scanner Types
// ════════════════════════════════════════════════════

export interface ScanOptions {
  domain: string;
  tenantId: string;
  userId: string;
  onProgress: (percent: number, message?: string) => Promise<void>;
}

export interface SslCheckResult {
  issuer: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  daysRemaining: number | null;
  isExpiring: boolean;
  isExpired: boolean;
}

export interface ScanResult {
  domain: string;
  ipAddress: string | null;
  subdomainsChecked: number;
  subdomainsFound: string[];
  openPorts: IPortInfo[];
  technologies: ITechnology[];
  sslInfo: SslCheckResult | null;
  shadowItAssets: Array<{
    domain: string;
    ipAddress: string;
    port: number;
    service: string;
    technology: string;
    riskScore: number;
  }>;
}

// ════════════════════════════════════════════════════
//  Core Scanner
// ════════════════════════════════════════════════════

export async function runScan(options: ScanOptions): Promise<ScanResult> {
  const { domain, tenantId, userId: _userId, onProgress } = options;

  // ── Phase 1: Resolve main domain (5%) ──
  await onProgress(5, 'Resolving main domain...');
  const mainIp = await resolveDomain(domain);

  // ── Phase 2: Enumerate subdomains (5% → 50%) ──
  await onProgress(10, 'Starting subdomain enumeration...');
  const subdomainsToCheck = COMMON_SUBDOMAINS.map((sub) => `${sub}.${domain}`);
  const resolvableSubdomains: string[] = [];

  const concurrency = 10;
  for (let i = 0; i < subdomainsToCheck.length; i += concurrency) {
    const batch = subdomainsToCheck.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (subdomain) => {
        const ip = await resolveDomain(subdomain).catch(() => null);
        return ip ? subdomain : null;
      }),
    );

    for (const result of results) {
      if (result) resolvableSubdomains.push(result);
    }

    // Progress: 10% → 50%
    const phaseProgress = 10 + Math.round(((i + concurrency) / subdomainsToCheck.length) * 40);
    await onProgress(Math.min(phaseProgress, 50), `Checking subdomains... (${i + concurrency}/${subdomainsToCheck.length})`);
  }

  // ── Save resolved subdomains ──
  const allDomains = [{ domain, ip: mainIp }];
  for (const sub of resolvableSubdomains) {
    const ip = await resolveDomain(sub).catch(() => null);
    allDomains.push({ domain: sub, ip });
  }

  // ── Phase 3: Port scanning (50% → 80%) ──
  await onProgress(50, 'Starting port scan...');
  const openPorts: IPortInfo[] = [];

  for (const target of allDomains.filter((d) => d.ip)) {
    // Real TCP port scan for each resolved host
    const portsOpen = await tcpPortScan(target.ip!, COMMON_PORTS);

    for (const port of portsOpen) {
      // Avoid duplicates across hosts
      if (!openPorts.find((p) => p.port === port.port)) {
        openPorts.push(port);
      }
    }

    // Save domain record to MongoDB
    const detectedTechs = detectTechnologies(portsOpen);
    await DiscoveredDomain.findOneAndUpdate(
      { domain: target.domain, tenantId },
      {
        $set: {
          domain: target.domain,
          parentDomain: domain,
          ipAddress: target.ip,
          ports: portsOpen,
          technologies: detectedTechs,
          isActive: true,
          lastSeenAt: new Date(),
          tenantId,
          scanJobId: '', // will be filled by caller
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    const resolvedList = allDomains.filter((d) => d.ip);
    const idx = resolvedList.indexOf(target);
    const pct = resolvedList.length > 0 ? (idx + 1) / resolvedList.length : 0;
    await onProgress(
      Math.min(80, 50 + Math.round(pct * 30)),
      `Port scan: ${target.domain}`,
    );
  }

  // ── Phase 4: SSL Certificate Check (80% → 88%) ──
  await onProgress(80, 'Checking SSL certificates...');
  const sslInfo = await checkSslCertificate(domain, mainIp);

  // If main domain has SSL, update the DiscoveredDomain record
  if (sslInfo && sslInfo.validTo && mainIp) {
    await DiscoveredDomain.findOneAndUpdate(
      { domain, tenantId },
      { $set: { ssl: { issuer: sslInfo.issuer, validFrom: sslInfo.validFrom, validTo: sslInfo.validTo } } },
    );
  }

  // ── Phase 5: Shadow IT Detection (88% → 95%) ──
  await onProgress(88, 'Detecting shadow IT assets...');
  const shadowItAssets: ScanResult['shadowItAssets'] = [];

  for (const target of allDomains.filter((d) => d.ip)) {
    for (const portInfo of openPorts) {
      if (SHADOW_IT_PORTS.includes(portInfo.port)) {
        const tech = detectTechnologies([portInfo]).map((t) => t.name).join(', ');
        const riskScore = calculateShadowItRiskScore(portInfo.port, tech);

        shadowItAssets.push({
          domain: target.domain,
          ipAddress: target.ip!,
          port: portInfo.port,
          service: portInfo.service,
          technology: tech,
          riskScore,
        });

        // Persist to ShadowItAsset collection
        await ShadowItAsset.findOneAndUpdate(
          { domain: target.domain, port: portInfo.port, tenantId },
          {
            $set: {
              domain: target.domain,
              ipAddress: target.ip!,
              port: portInfo.port,
              service: portInfo.service,
              technology: tech,
              isShadowIt: true,
              riskScore,
              detectedAt: new Date(),
              tenantId,
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true },
        );
      }
    }
  }

  // ── Phase 6: Finalize (95% → 100%) ──
  await onProgress(95, 'Finalizing results...');

  const allTechnologies = detectTechnologies(openPorts);

  const result: ScanResult = {
    domain,
    ipAddress: mainIp,
    subdomainsChecked: subdomainsToCheck.length,
    subdomainsFound: resolvableSubdomains,
    openPorts,
    technologies: allTechnologies,
    sslInfo,
    shadowItAssets,
  };

  await onProgress(100, 'Scan complete');
  return result;
}

// ════════════════════════════════════════════════════
//  Helper Functions
// ════════════════════════════════════════════════════

/**
 * Resolve domain to IPv4 address.
 */
async function resolveDomain(domain: string): Promise<string | null> {
  try {
    const records = await dns.resolve4(domain);
    return records[0] || null;
  } catch {
    // Also try to resolve AAAA (IPv6) as fallback
    try {
      const records = await dns.resolve6(domain);
      return records[0] || null;
    } catch {
      return null;
    }
  }
}

/**
 * Real TCP port scanning using actual TCP connections.
 * Tries to connect to each port and reports it as open if the connection succeeds.
 * Uses a 2-second timeout per port.
 */
async function tcpPortScan(
  ip: string,
  ports: Array<{ port: number; service: string; protocol: 'TCP' | 'UDP' }>,
  concurrency = 20,
): Promise<IPortInfo[]> {
  const results: IPortInfo[] = [];
  const tcpPorts = ports.filter((p) => p.protocol === 'TCP');

  for (let i = 0; i < tcpPorts.length; i += concurrency) {
    const batch = tcpPorts.slice(i, i + concurrency);
    const scans = batch.map(async (p) => {
      const isOpen = await checkTcpPort(ip, p.port, 2000);
      return isOpen
        ? { port: p.port, service: p.service, protocol: 'TCP' as const, isOpen: true }
        : null;
    });

    const batchResults = await Promise.all(scans);
    for (const r of batchResults) {
      if (r) results.push(r);
    }
  }

  return results;
}

/**
 * Check if a single TCP port is open by attempting a connection.
 * Returns true if the connection succeeds (port is open).
 */
function checkTcpPort(ip: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, ip);
  });
}

/**
 * Detect web technologies based on open ports.
 */
function detectTechnologies(ports: IPortInfo[]): ITechnology[] {
  const detected: ITechnology[] = [];
  const openPortNumbers = ports.map((p) => p.port);

  for (const tech of WEB_TECHNOLOGIES) {
    // Check if any of the technology's ports are open
    const hasMatchingPort = tech.ports.some((p) => openPortNumbers.includes(p));
    if (hasMatchingPort) {
      detected.push({ name: tech.name, category: tech.category });
    }
  }

  return detected;
}

/**
 * Check SSL certificate expiry for an HTTPS domain.
 * Connects to port 443 (or 8443 as fallback) and reads the TLS certificate.
 */
async function checkSslCertificate(
  domain: string,
  ip: string | null,
): Promise<SslCheckResult | null> {
  const host = ip || domain;
  const httpsPorts = [443, 8443];

  for (const port of httpsPorts) {
    try {
      const cert = await getTlsCertificate(host, port, 5000);
      if (cert) {
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const daysRemaining = Math.round((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return {
          issuer: cert.issuer?.O || cert.issuer?.CN || null,
          validFrom,
          validTo,
          daysRemaining,
          isExpiring: daysRemaining <= SSL_WARN_DAYS && daysRemaining > 0,
          isExpired: daysRemaining <= 0,
        };
      }
    } catch {
      // Try next port
      continue;
    }
  }

  return null;
}

/**
 * Retrieve the TLS certificate from a host:port within the given timeout.
 */
function getTlsCertificate(
  host: string,
  port: number,
  timeoutMs: number,
): Promise<{ valid_from: string; valid_to: string; issuer: { O?: string; CN?: string } | null } | null> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      port,
      host,
      { servername: host, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate();
        socket.destroy();
        if (cert && cert.valid_from && cert.valid_to) {
          resolve({
            valid_from: cert.valid_from,
            valid_to: cert.valid_to,
            issuer: typeof cert.issuer === 'string' ? cert.issuer : null,
          });
        } else {
          resolve(null);
        }
      },
    );

    socket.setTimeout(timeoutMs);

    socket.on('error', () => {
      socket.destroy();
      resolve(null);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(null);
    });
  });
}

/**
 * Calculate a risk score for a potential shadow IT asset.
 * Higher risk for uncommon ports combined with no detected technology.
 */
function calculateShadowItRiskScore(port: number, technology: string): number {
  let score = 30; // Base risk for being on a non-standard port

  // Higher risk for development/debug ports
  if ([3000, 3001, 4200, 5000, 5001].includes(port)) {
    score += 25;
  }

  // Database / cache ports are high risk
  if ([6379, 27017, 5432, 3306].includes(port)) {
    score += 40;
  }

  // Admin panels and monitoring
  if ([9090, 8888, 9000].includes(port)) {
    score += 20;
  }

  // No recognizable technology increases risk (unmanaged / unknown)
  if (!technology) {
    score += 20;
  }

  return Math.min(score, 100);
}

