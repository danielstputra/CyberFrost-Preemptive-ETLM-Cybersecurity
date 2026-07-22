/**
 * CyberFrost — MongoDB Data Seeder
 * ==================================
 * Seeds sample data into MongoDB for all 5 services.
 * Run: npx tsx scripts/seed-mongo.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyfirma?authSource=admin';
const TENANT_ID = 'default';
const NOW = new Date();
const DAY = 24 * 60 * 60 * 1000;

async function main() {
  console.log('[Seed-Mongo] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('[Seed-Mongo] Connected\n');

  // ──────────────────────────────────────────────
  //  1. DISCOVERY SERVICE
  // ──────────────────────────────────────────────
  console.log('[Seed] 1/5 — Discovery Service...');

  const discoveredDomains = [
    { name: 'app.cyberfrost.vercel.app', ip: '76.76.21.21', port: 443, service: 'HTTPS', technology: 'Vercel', category: 'CDN' },
    { name: 'api.cyberfrost.vercel.app', ip: '76.76.21.22', port: 443, service: 'HTTPS', technology: 'Next.js', category: 'WEB_FRAMEWORK' },
    { name: 'mail.cyberfrost.vercel.app', ip: '192.168.1.10', port: 993, service: 'IMAPS', technology: 'Dovecot', category: 'MAIL_SERVER' },
    { name: 'admin.cyberfrost.vercel.app', ip: '76.76.21.23', port: 443, service: 'HTTPS', technology: 'Nginx', category: 'WEB_SERVER' },
    { name: 'dev.cyberfrost.vercel.app', ip: '76.76.21.24', port: 80, service: 'HTTP', technology: 'Apache', category: 'WEB_SERVER' },
    { name: 'dev.cyberfrost.vercel.app', ip: '76.76.21.24', port: 8080, service: 'HTTP-Alt', technology: 'Tomcat', category: 'APPLICATION_SERVER' },
    { name: 'cdn.cyberfrost.vercel.app', ip: '76.76.21.25', port: 443, service: 'HTTPS', technology: 'Cloudflare', category: 'CDN' },
    { name: 'sso.cyberfrost.vercel.app', ip: '76.76.21.26', port: 443, service: 'HTTPS', technology: 'Keycloak', category: 'IDENTITY' },
    { name: 'git.cyberfrost.vercel.app', ip: '76.76.21.27', port: 22, service: 'SSH', technology: 'OpenSSH', category: 'REMOTE_ACCESS' },
    { name: 'monitor.cyberfrost.vercel.app', ip: '76.76.21.28', port: 9090, service: 'Prometheus', technology: 'Prometheus', category: 'MONITORING' },
  ];

  const domainCol = mongoose.connection.db.collection('discovered_domains');
  await domainCol.deleteMany({});
  for (const d of discoveredDomains) {
    await domainCol.insertOne({
      domain: d.name,
      ipAddress: d.ip,
      ports: [{ port: d.port, service: d.service, protocol: d.port === 22 ? 'TCP' : 'TCP', isOpen: true }],
      technologies: [{ name: d.technology, category: d.category, version: 'latest', port: d.port, detectedAt: NOW }],
      ssl: d.port === 443 ? { issuer: 'Let\'s Encrypt', validFrom: new Date(NOW.getTime() - 30 * DAY), validTo: new Date(NOW.getTime() + 60 * DAY), subject: d.name } : null,
      isActive: true,
      tenantId: TENANT_ID,
      lastSeen: NOW,
      firstDiscovered: new Date(NOW.getTime() - 7 * DAY),
      metadata: { scanId: 'seed-initial' },
      createdAt: NOW,
      updatedAt: NOW,
    });
  }
  console.log(`  ✓ ${discoveredDomains.length} domains`);

  // Scan Jobs
  const scanCol = mongoose.connection.db.collection('scan_jobs');
  await scanCol.deleteMany({});
  await scanCol.insertOne({
    targetDomain: 'cyberfrost.vercel.app',
    status: 'COMPLETED',
    progress: 100,
    startedAt: new Date(NOW.getTime() - 1 * DAY),
    completedAt: NOW,
    totalAssetsFound: discoveredDomains.length,
    tenantId: TENANT_ID,
    initiatedBy: 'admin',
    error: null,
    metadata: {},
    createdAt: new Date(NOW.getTime() - 1 * DAY),
    updatedAt: NOW,
  });
  console.log('  ✓ 1 scan job');

  // ──────────────────────────────────────────────
  //  2. INTELLIGENCE SERVICE
  // ──────────────────────────────────────────────
  console.log('[Seed] 2/5 — Intelligence Service...');

  const vulnerabilities = [
    { cveId: 'CVE-2026-12345', title: 'Critical RCE in Apache Log4j', severity: 'CRITICAL', score: 9.8, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', exploit: true, source: 'NVD', desc: 'Remote code execution vulnerability in Apache Log4j versions 2.0 through 2.17.0.' },
    { cveId: 'CVE-2026-12346', title: 'SQL Injection in PostgreSQL', severity: 'HIGH', score: 8.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', exploit: true, source: 'NVD', desc: 'SQL injection vulnerability in PostgreSQL database server.' },
    { cveId: 'CVE-2026-12347', title: 'XSS in Next.js Framework', severity: 'MEDIUM', score: 6.1, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N', exploit: false, source: 'NVD', desc: 'Cross-site scripting vulnerability in Next.js framework versions prior to 14.2.0.' },
    { cveId: 'CVE-2026-12348', title: 'OpenSSL Buffer Overflow', severity: 'HIGH', score: 7.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H', exploit: true, source: 'CISA-KEV', desc: 'Buffer overflow vulnerability in OpenSSL TLS handshake.' },
    { cveId: 'CVE-2026-12349', title: 'Redis Unauthenticated Access', severity: 'MEDIUM', score: 5.3, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N', exploit: true, source: 'NVD', desc: 'Unauthenticated Redis server access vulnerability.' },
    { cveId: 'CVE-2026-12350', title: 'Kubernetes Privilege Escalation', severity: 'CRITICAL', score: 9.0, vector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H', exploit: false, source: 'NVD', desc: 'Privilege escalation vulnerability in Kubernetes kubelet.' },
    { cveId: 'CVE-2026-12351', title: 'Nginx Directory Traversal', severity: 'MEDIUM', score: 5.0, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N', exploit: true, source: 'CISA-KEV', desc: 'Directory traversal vulnerability in Nginx versions prior to 1.24.0.' },
    { cveId: 'CVE-2026-12352', title: 'Docker Container Escape', severity: 'HIGH', score: 8.0, vector: 'CVSS:3.1/AV:L/AC:L/PR:H/UI:N/S:C/C:H/I:H/A:H', exploit: false, source: 'NVD', desc: 'Container escape vulnerability in Docker runc.' },
    { cveId: 'CVE-2026-12353', title: 'Linux Kernel Heap Overflow', severity: 'HIGH', score: 7.8, vector: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', exploit: true, source: 'NVD', desc: 'Heap overflow in Linux kernel network subsystem.' },
    { cveId: 'CVE-2026-12354', title: 'Python urllib SSRF', severity: 'LOW', score: 3.7, vector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N', exploit: false, source: 'NVD', desc: 'Server-side request forgery in Python urllib library.' },
  ];

  const vulnCol = mongoose.connection.db.collection('vulnerabilities');
  await vulnCol.deleteMany({});
  for (const v of vulnerabilities) {
    await vulnCol.insertOne({
      cveId: v.cveId,
      title: v.title,
      description: v.desc,
      cvss: { score: v.score, vector: v.vector },
      severity: v.severity,
      affectedProducts: ['CyberFrost Platform'],
      exploitAvailable: v.exploit,
      exploitDetails: v.exploit ? `Public exploit available for ${v.cveId}` : null,
      publishedAt: new Date(NOW.getTime() - Math.random() * 30 * DAY),
      lastModifiedAt: NOW,
      source: v.source,
      references: [`https://nvd.nist.gov/vuln/detail/${v.cveId}`],
      tags: [v.severity.toLowerCase(), v.source.toLowerCase()],
      status: 'NEW',
      tenantId: TENANT_ID,
      metadata: {},
      createdAt: NOW,
      updatedAt: NOW,
    });
  }
  console.log(`  ✓ ${vulnerabilities.length} CVEs`);

  // Threat Intel
  const threatCol = mongoose.connection.db.collection('threat_intel');
  await threatCol.deleteMany({});
  const threats = [
    { title: 'APT-C-36 (Blind Eagle) Campaign', type: 'APT', severity: 'CRITICAL', desc: 'Advanced persistent threat group targeting government entities in Latin America.', sector: 'Government' },
    { title: 'LockBit 4.0 Ransomware Wave', type: 'RANSOMWARE', severity: 'HIGH', desc: 'New LockBit variant exploiting recent Windows vulnerabilities for initial access.', sector: 'Healthcare' },
    { title: 'Phishing-as-a-Service: Fraudeasy', type: 'PHISHING', severity: 'HIGH', desc: 'New PhaaS platform offering realistic banking login pages with Telegram exfiltration.', sector: 'Financial' },
    { title: 'DDoS Botnet: Cyclone-2026', type: 'BOTNET', severity: 'MEDIUM', desc: 'Emerging IoT botnet leveraging unpatched router vulnerabilities for HTTPS flood attacks.', sector: 'Telecommunications' },
    { title: 'Supply Chain: npm Dependency Confusion', type: 'SUPPLY_CHAIN', severity: 'CRITICAL', desc: 'Active dependency confusion attack targeting popular Node.js packages with typosquatted names.', sector: 'Technology' },
  ];
  for (const t of threats) {
    await threatCol.insertOne({
      title: t.title,
      description: t.desc,
      threatType: t.type,
      severity: t.severity,
      status: 'ACTIVE',
      source: 'Analyst Research',
      mitreAttackIds: ['T1583', 'T1071'],
      affectedSectors: [t.sector],
      affectedRegions: ['Global'],
      indicators: [
        { type: 'IP', value: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.0.1` },
        { type: 'DOMAIN', value: `malicious-${t.type.toLowerCase()}.xyz` },
      ],
      firstObserved: new Date(NOW.getTime() - 14 * DAY),
      lastObserved: NOW,
      tenantId: TENANT_ID,
      metadata: {},
      createdAt: NOW,
      updatedAt: NOW,
    });
  }
  console.log(`  ✓ ${threats.length} threat intel items`);

  // ──────────────────────────────────────────────
  //  3. OSINT SERVICE
  // ──────────────────────────────────────────────
  console.log('[Seed] 3/5 — OSINT Service...');

  const leakCol = mongoose.connection.db.collection('dark_web_leaks');
  await leakCol.deleteMany({});
  const leaks = [
    { title: 'Data Breach — Acme Corp Database', type: 'CREDENTIAL_DUMP', severity: 'CRITICAL', domain: 'acmecorp.com', emails: 15000 },
    { title: 'Credentials Leak — Admin Panel', type: 'CREDENTIAL_DUMP', severity: 'HIGH', domain: 'admin-panel.example.com', emails: 2500 },
    { title: 'Code Repository Leak — Internal Tools', type: 'SOURCE_CODE', severity: 'CRITICAL', domain: 'github.com/leaked-org', emails: 0 },
    { title: 'Configuration File Exposure', type: 'CONFIG_LEAK', severity: 'HIGH', domain: 'config.example.org', emails: 0 },
    { title: 'Customer Data Sale on Dark Web', type: 'CREDENTIAL_DUMP', severity: 'CRITICAL', domain: 'customer-db.example.com', emails: 50000 },
  ];
  for (const l of leaks) {
    await leakCol.insertOne({
      title: l.title,
      source: 'Dark Web Forum',
      sourceUrl: 'http://darknetforum.onion/thread/12345',
      domain: l.domain,
      leakType: l.type,
      content: `Sample leaked data content for ${l.title}. Contains email addresses, password hashes, and personal information.`,
      snippet: `Exposed records: ${l.emails.toLocaleString()} emails`,
      severity: l.severity,
      status: 'NEW',
      leakedCredentials: l.emails > 0,
      emailsFound: l.emails > 0 ? [`user@${l.domain}`, `admin@${l.domain}`] : [],
      passwordsFound: l.emails > 0,
      emailsInvolved: l.emails,
      discoveredAt: new Date(NOW.getTime() - 3 * DAY),
      osintJobId: 'seed-job-001',
      tenantId: TENANT_ID,
      metadata: {},
      createdAt: NOW,
      updatedAt: NOW,
    });
  }
  console.log(`  ✓ ${leaks.length} dark web leaks`);

  const exposureCol = mongoose.connection.db.collection('brand_exposures');
  await exposureCol.deleteMany({});
  const exposures = [
    { title: 'Impersonator Domain: cyberfrost-secure.com', type: 'IMPERSONATOR_DOMAIN', severity: 'CRITICAL' },
    { title: 'Fake Mobile App on Google Play', type: 'FAKE_APP', severity: 'HIGH' },
    { title: 'Social Media Impersonation — Instagram', type: 'SOCIAL_MEDIA', severity: 'MEDIUM' },
    { title: 'Trademark Misuse on Marketplace', type: 'TRADEMARK', severity: 'MEDIUM' },
    { title: 'Phishing Page — cyberfrost-login.com', type: 'PHISHING', severity: 'CRITICAL' },
  ];
  for (const e of exposures) {
    await exposureCol.insertOne({
      title: e.title,
      brandName: 'CyberFrost',
      exposureType: e.type,
      severity: e.severity,
      status: 'NEW',
      url: `https://${e.title.toLowerCase().replace(/\s+/g, '-')}.com`,
      source: 'Automated Scan',
      description: `Identified potential brand exposure: ${e.title}. Requires investigation.`,
      discoveredAt: NOW,
      osintJobId: 'seed-job-001',
      tenantId: TENANT_ID,
      metadata: {},
      createdAt: NOW,
      updatedAt: NOW,
    });
  }
  console.log(`  ✓ ${exposures.length} brand exposures`);

  // OSINT Scan Job
  const osintScanCol = mongoose.connection.db.collection('osint_scan_jobs');
  await osintScanCol.deleteMany({});
  await osintScanCol.insertOne({
    targetDomain: 'cyberfrost.vercel.app',
    status: 'COMPLETED',
    progress: 100,
    scanType: 'DOMAIN',
    startedAt: new Date(NOW.getTime() - 2 * DAY),
    completedAt: NOW,
    totalLeaksFound: leaks.length,
    totalExposuresFound: exposures.length,
    tenantId: TENANT_ID,
    initiatedBy: 'admin',
    metadata: {},
    createdAt: new Date(NOW.getTime() - 2 * DAY),
    updatedAt: NOW,
  });
  console.log('  ✓ 1 OSINT scan job');

  // ──────────────────────────────────────────────
  //  4. NOTIFICATION SERVICE
  // ──────────────────────────────────────────────
  console.log('[Seed] 4/5 — Notification Service...');

  const notifCol = mongoose.connection.db.collection('notifications');
  await notifCol.deleteMany({});
  const notifTypes = [
    { type: 'CRITICAL', severity: 'CRITICAL', title: 'Critical Vulnerability Detected', message: 'CVE-2026-12345 affecting Apache Log4j requires immediate attention.' },
    { type: 'WARNING', severity: 'HIGH', title: 'New Threat Campaign Active', message: 'LockBit 4.0 ransomware campaign detected in your sector.' },
    { type: 'ALERT', severity: 'MEDIUM', title: 'Domain Certificate Expiring', message: 'SSL certificate for app.cyberfrost.vercel.app expires in 14 days.' },
    { type: 'INFO', severity: 'LOW', title: 'Scan Completed', message: 'Attack surface scan completed: 10 assets discovered.' },
    { type: 'CRITICAL', severity: 'CRITICAL', title: 'Dark Web Leak Detected', message: 'Customer credentials found on dark web forum.' },
    { type: 'WARNING', severity: 'MEDIUM', title: 'New Subdomain Discovered', message: 'Unregistered subdomain dev-api.cyberfrost.vercel.app found.' },
    { type: 'INFO', severity: 'LOW', title: 'OSINT Scan Complete', message: 'Brand monitoring scan completed: 5 potential exposures found.' },
    { type: 'ALERT', severity: 'HIGH', title: 'Phishing Site Reported', message: 'Impersonator domain cyberfrost-secure.com reported for takedown.' },
  ];
  for (const n of notifTypes) {
    await notifCol.insertOne({
      title: n.title,
      message: n.message,
      type: n.type,
      eventType: n.type === 'CRITICAL' ? 'THREAT_DETECTED' : n.type === 'WARNING' ? 'VULNERABILITY_FOUND' : 'SCAN_COMPLETED',
      sourceService: n.type === 'CRITICAL' ? 'intelligence-service' : 'discovery-service',
      read: false,
      readAt: null,
      tenantId: TENANT_ID,
      sourceId: null,
      metadata: {},
      createdAt: new Date(NOW.getTime() - Math.random() * 7 * DAY),
      updatedAt: NOW,
    });
  }
  console.log(`  ✓ ${notifTypes.length} notifications`);

  // ──────────────────────────────────────────────
  //  5. ACTION & MITIGATION SERVICE
  // ──────────────────────────────────────────────
  console.log('[Seed] 5/5 — Action & Mitigation Service...');

  const takedownCol = mongoose.connection.db.collection('takedown_requests');
  await takedownCol.deleteMany({});
  const takedowns = [
    { target: 'https://phishing-cyberfrost.com/login', domain: 'phishing-cyberfrost.com', type: 'PHISHING', platform: 'ABUSE_EMAIL', status: 'SUBMITTED' },
    { target: 'https://fake-cyberfrost-app.com/download', domain: 'fake-cyberfrost-app.com', type: 'MALWARE', platform: 'GOOGLE_SAFE_BROWSING', status: 'SUBMITTED' },
    { target: 'https://cyberfrost-trademark-violation.com', domain: 'cyberfrost-trademark-violation.com', type: 'TRADEMARK', platform: 'MANUAL', status: 'DRAFT' },
    { target: 'https://cyberfrost-copyright-infringement.com', domain: 'cyberfrost-copyright-infringement.com', type: 'COPYRIGHT', platform: 'ABUSE_EMAIL', status: 'IN_REVIEW' },
    { target: 'https://cyberfrost-phishing-v2.com', domain: 'cyberfrost-phishing-v2.com', type: 'PHISHING', platform: 'PHISHTANK', status: 'ACTIONED' },
  ];
  for (const t of takedowns) {
    await takedownCol.insertOne({
      targetUrl: t.target,
      domain: t.domain,
      threatType: t.type,
      platform: t.platform,
      status: t.status,
      evidence: `Evidence bundle for ${t.domain}`,
      submittedTo: t.platform,
      submittedAt: t.status !== 'DRAFT' ? NOW : null,
      responseRef: t.status !== 'DRAFT' ? `REF-${Math.random().toString(36).slice(2, 8).toUpperCase()}` : null,
      responseData: {},
      notes: `Automated takedown request for ${t.domain}`,
      tenantId: TENANT_ID,
      createdBy: 'admin',
      createdAt: NOW,
      updatedAt: NOW,
    });
  }
  console.log(`  ✓ ${takedowns.length} takedown requests`);

  const mitigationCol = mongoose.connection.db.collection('mitigation_actions');
  await mitigationCol.deleteMany({});
  const mitigations = [
    { target: '192.168.1.100', type: 'IP', action: 'BLOCK', reason: 'Malicious IP — attempted SQL injection on API gateway' },
    { target: 'malware-distribution.xyz', type: 'DOMAIN', action: 'BLOCK', reason: 'Known malware distribution domain' },
    { target: '10.0.0.50', type: 'IP', action: 'BLOCK', reason: 'Brute force attack detected on SSH service' },
    { target: 'phishing-campaign.net', type: 'DOMAIN', action: 'BLOCK', reason: 'Active phishing campaign targeting CyberFrost users' },
    { target: '203.0.113.45', type: 'IP', action: 'MONITOR', reason: 'Suspicious port scanning activity' },
  ];
  for (const m of mitigations) {
    await mitigationCol.insertOne({
      target: m.target,
      targetType: m.type,
      actionType: m.action,
      reason: m.reason,
      status: m.action === 'BLOCK' ? 'ACTIVE' : 'PENDING',
      source: 'Automated Response System',
      sourceService: 'action-mitigation-service',
      ruleName: `auto-block-${m.target}-${Date.now()}`,
      expiresAt: new Date(NOW.getTime() + 30 * DAY),
      blockedAt: m.action === 'BLOCK' ? NOW : null,
      tenantId: TENANT_ID,
      initiatedBy: 'system',
      metadata: {},
      createdAt: NOW,
      updatedAt: NOW,
    });
  }
  console.log(`  ✓ ${mitigations.length} mitigation actions\n`);

  console.log('[Seed-Mongo] ✅ All data seeded successfully!');
  console.log('[Seed-Mongo] Discovered domains: ' + discoveredDomains.length);
  console.log('[Seed-Mongo] CVEs: ' + vulnerabilities.length);
  console.log('[Seed-Mongo] Threat intel: ' + threats.length);
  console.log('[Seed-Mongo] Dark web leaks: ' + leaks.length);
  console.log('[Seed-Mongo] Brand exposures: ' + exposures.length);
  console.log('[Seed-Mongo] Notifications: ' + notifTypes.length);
  console.log('[Seed-Mongo] Takedown requests: ' + takedowns.length);
  console.log('[Seed-Mongo] Mitigation actions: ' + mitigations.length);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('[Seed-Mongo] ❌ Error:', err);
  process.exit(1);
});
