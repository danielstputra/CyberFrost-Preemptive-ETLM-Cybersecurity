import { Router, Request, Response } from 'express';
import { z } from 'zod';
import puppeteer from 'puppeteer';

const router: Router = Router();

// ──────────────────────────────────────
// Validation Schema
// ──────────────────────────────────────

const generateReportSchema = z.object({
  tenantId: z.string().min(1, 'tenantId is required'),
  reportType: z.enum(['executive', 'technical', 'compliance', 'threat-hunt']),
  tenantName: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ──────────────────────────────────────
// Mock Data Helpers (will be replaced with real DB queries)
// ──────────────────────────────────────

interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface TopCve {
  id: string;
  score: number;
  description: string;
  affectedAsset: string;
  status: string;
}

interface ActiveThreat {
  id: string;
  type: string;
  severity: string;
  source: string;
  detectedAt: string;
  status: string;
}

function getMockSeverityBreakdown(): SeverityBreakdown {
  return { critical: 12, high: 47, medium: 89, low: 156 };
}

function getMockTopCves(): TopCve[] {
  return [
    { id: 'CVE-2025-44221', score: 9.8, description: 'Remote code execution in Apache Log4j core', affectedAsset: 'log-server-01.example.com', status: 'Active' },
    { id: 'CVE-2025-38472', score: 9.1, description: 'SQL injection in web application firewall bypass', affectedAsset: 'api-gateway.internal', status: 'In Progress' },
    { id: 'CVE-2025-31085', score: 8.7, description: 'Privilege escalation in Kubernetes kubelet', affectedAsset: 'k8s-worker-03', status: 'Active' },
    { id: 'CVE-2025-29113', score: 8.4, description: 'Cross-site scripting in admin dashboard', affectedAsset: 'admin.cyberfrost.io', status: 'Mitigated' },
    { id: 'CVE-2025-22704', score: 7.9, description: 'Authentication bypass in OAuth2 proxy', affectedAsset: 'auth-proxy-01', status: 'In Progress' },
  ];
}

function getMockActiveThreats(): ActiveThreat[] {
  return [
    { id: 'THR-001', type: 'Phishing Campaign', severity: 'Critical', source: 'OSINT Scan', detectedAt: '2026-07-19T03:12:00Z', status: 'Active' },
    { id: 'THR-002', type: 'DDoS Attack', severity: 'High', source: 'Network Monitor', detectedAt: '2026-07-18T22:45:00Z', status: 'Mitigating' },
    { id: 'THR-003', type: 'Data Exfiltration', severity: 'Critical', source: 'DLP Alert', detectedAt: '2026-07-18T14:30:00Z', status: 'Contained' },
    { id: 'THR-004', type: 'Malware Detected', severity: 'Medium', source: 'Endpoint Protection', detectedAt: '2026-07-17T09:15:00Z', status: 'Remediated' },
    { id: 'THR-005', type: 'Brute Force Login', severity: 'High', source: 'Auth Service', detectedAt: '2026-07-17T06:00:00Z', status: 'Active' },
  ];
}

// ──────────────────────────────────────
// HTML Template — Executive Report (dark theme)
// ──────────────────────────────────────

function buildExecutiveReportHtml(params: {
  tenantName: string;
  dateFrom: string;
  dateTo: string;
  severity: SeverityBreakdown;
  topCves: TopCve[];
  activeThreats: ActiveThreat[];
}): string {
  const {
    tenantName,
    dateFrom,
    dateTo,
    severity,
    topCves,
    activeThreats,
  } = params;

  const totalVulnerabilities = severity.critical + severity.high + severity.medium + severity.low;
  const maxSeverity = Math.max(severity.critical, severity.high, severity.medium, severity.low, 1);
  const criticalPct = ((severity.critical / totalVulnerabilities) * 100).toFixed(1);
  const highPct = ((severity.high / totalVulnerabilities) * 100).toFixed(1);
  const mediumPct = ((severity.medium / totalVulnerabilities) * 100).toFixed(1);
  const lowPct = ((severity.low / totalVulnerabilities) * 100).toFixed(1);
  const activeThreatCount = activeThreats.filter(t => t.severity === 'Critical' || t.severity === 'High').length;

  // Build severity bar chart
  const severityBars = [
    { label: 'Critical', count: severity.critical, color: '#ff2d55', pct: criticalPct },
    { label: 'High', count: severity.high, color: '#ff9500', pct: highPct },
    { label: 'Medium', count: severity.medium, color: '#ffcc00', pct: mediumPct },
    { label: 'Low', count: severity.low, color: '#34c759', pct: lowPct },
  ];

  const severityBarsHtml = severityBars.map(bar => {
    const barWidth = (bar.count / maxSeverity) * 100;
    return `
      <div class="bar-row">
        <div class="bar-label">${bar.label}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${barWidth}%; background: ${bar.color};"></div>
        </div>
        <div class="bar-value">${bar.count} (${bar.pct}%)</div>
      </div>
    `;
  }).join('');

  // Build top CVEs table
  const cveRows = topCves.map((cve, idx) => {
    const scoreColor = cve.score >= 9.0 ? '#ff2d55' : cve.score >= 7.0 ? '#ff9500' : '#ffcc00';
    return `
      <tr>
        <td class="cve-rank">${idx + 1}</td>
        <td class="cve-id">${cve.id}</td>
        <td class="cve-score" style="color: ${scoreColor}; font-weight: 700;">${cve.score.toFixed(1)}</td>
        <td class="cve-desc">${cve.description}</td>
        <td class="cve-asset">${cve.affectedAsset}</td>
        <td class="cve-status"><span class="badge badge-${cve.status.toLowerCase().replace(/\s+/g, '-')}">${cve.status}</span></td>
      </tr>
    `;
  }).join('');

  // Build active threats table
  const threatRows = activeThreats.map(t => {
    const severityClass = t.severity.toLowerCase();
    return `
      <tr>
        <td class="threat-id">${t.id}</td>
        <td class="threat-type">${t.type}</td>
        <td class="threat-severity"><span class="badge badge-${severityClass}">${t.severity}</span></td>
        <td class="threat-source">${t.source}</td>
        <td class="threat-date">${new Date(t.detectedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        <td class="threat-status"><span class="badge badge-${t.status.toLowerCase()}">${t.status}</span></td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Security Report — ${tenantName}</title>
  <style>
    /* ── Reset & Base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #0d1117;
      color: #e6edf3;
      padding: 40px 48px;
      line-height: 1.6;
    }

    /* ── Cover Page ── */
    .cover {
      text-align: center;
      padding: 80px 0 60px;
      border-bottom: 1px solid #30363d;
      margin-bottom: 40px;
    }
    .cover .logo {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #58a6ff, #3b82f6);
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      font-size: 28px;
      font-weight: 800;
      color: #fff;
    }
    .cover h1 {
      font-size: 32px;
      font-weight: 700;
      background: linear-gradient(135deg, #58a6ff, #a371f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .cover .subtitle {
      color: #8b949e;
      font-size: 16px;
      margin-top: 8px;
    }
    .cover .meta {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 24px;
      color: #8b949e;
      font-size: 14px;
    }
    .cover .meta span { color: #e6edf3; font-weight: 600; }

    /* ── Section Headers ── */
    .section {
      margin-bottom: 36px;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #21262d;
    }
    .section-header h2 {
      font-size: 22px;
      font-weight: 600;
      color: #f0f6fc;
    }
    .section-header .icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .icon-severity { background: rgba(255, 45, 85, 0.15); color: #ff2d55; }
    .icon-cve { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .icon-threat { background: rgba(255, 204, 0, 0.15); color: #ffcc00; }

    /* ── KPI Cards ── */
    .kpi-row {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    .kpi-card {
      flex: 1;
      min-width: 160px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 20px 24px;
    }
    .kpi-card .kpi-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #8b949e;
    }
    .kpi-card .kpi-value {
      font-size: 32px;
      font-weight: 700;
      margin-top: 4px;
    }
    .kpi-card .kpi-sub {
      font-size: 13px;
      color: #8b949e;
      margin-top: 2px;
    }
    .kpi-card.critical .kpi-value { color: #ff2d55; }
    .kpi-card.high .kpi-value { color: #ff9500; }
    .kpi-card.medium .kpi-value { color: #ffcc00; }
    .kpi-card.low .kpi-value { color: #34c759; }
    .kpi-card.total .kpi-value { color: #58a6ff; }
    .kpi-card.active .kpi-value { color: #ff2d55; }

    /* ── Severity Bars ── */
    .severity-chart {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 24px;
    }
    .bar-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 14px;
    }
    .bar-row:last-child { margin-bottom: 0; }
    .bar-label {
      width: 72px;
      font-size: 14px;
      font-weight: 600;
      color: #c9d1d9;
      text-align: right;
    }
    .bar-track {
      flex: 1;
      height: 24px;
      background: #21262d;
      border-radius: 6px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.3s ease;
    }
    .bar-value {
      width: 100px;
      font-size: 14px;
      color: #8b949e;
      font-variant-numeric: tabular-nums;
    }

    /* ── Tables ── */
    .table-wrapper {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead th {
      background: #21262d;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #8b949e;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #30363d;
    }
    tbody td {
      padding: 12px 16px;
      border-bottom: 1px solid #21262d;
      color: #c9d1d9;
    }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: rgba(88, 166, 255, 0.05); }
    .cve-rank { width: 32px; color: #8b949e; text-align: center; }
    .cve-id { font-family: 'SF Mono', 'Fira Code', monospace; font-weight: 600; color: #58a6ff; }
    .cve-score { font-family: 'SF Mono', 'Fira Code', monospace; text-align: center; }

    /* ── Badges ── */
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .badge-active, .badge-critical { background: rgba(255, 45, 85, 0.15); color: #ff2d55; }
    .badge-mitigating, .badge-contained, .badge-in-progress, .badge-high { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
    .badge-medium { background: rgba(255, 204, 0, 0.15); color: #ffcc00; }
    .badge-remediated, .badge-mitigated, .badge-low { background: rgba(52, 199, 89, 0.15); color: #34c759; }

    /* ── Footer ── */
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #30363d;
      text-align: center;
      color: #484f58;
      font-size: 12px;
    }
    .footer .generated-by { color: #58a6ff; }

    /* ── Print / PDF tweaks ── */
    @media print {
      body { padding: 20px; }
      .cover { padding: 40px 0 30px; }
    }
  </style>
</head>
<body>

  <!-- ─── Cover ─── -->
  <div class="cover">
    <div class="logo">CF</div>
    <h1>Executive Security Report</h1>
    <p class="subtitle">${tenantName} — Vulnerability &amp; Threat Assessment</p>
    <div class="meta">
      <div>Report Period: <span>${dateFrom} — ${dateTo}</span></div>
      <div>Generated: <span>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
    </div>
  </div>

  <!-- ─── KPI Cards ─── -->
  <div class="kpi-row">
    <div class="kpi-card total">
      <div class="kpi-label">Total Vulnerabilities</div>
      <div class="kpi-value">${totalVulnerabilities}</div>
      <div class="kpi-sub">Across all severity levels</div>
    </div>
    <div class="kpi-card critical">
      <div class="kpi-label">Critical</div>
      <div class="kpi-value">${severity.critical}</div>
      <div class="kpi-sub">${criticalPct}% of total</div>
    </div>
    <div class="kpi-card high">
      <div class="kpi-label">High</div>
      <div class="kpi-value">${severity.high}</div>
      <div class="kpi-sub">${highPct}% of total</div>
    </div>
    <div class="kpi-card active">
      <div class="kpi-label">Active Critical/High Threats</div>
      <div class="kpi-value">${activeThreatCount}</div>
      <div class="kpi-sub">Requiring immediate attention</div>
    </div>
  </div>

  <!-- ─── Severity Breakdown ─── -->
  <div class="section">
    <div class="section-header">
      <div class="icon icon-severity">&#9632;</div>
      <h2>Severity Breakdown</h2>
    </div>
    <div class="severity-chart">
      ${severityBarsHtml}
    </div>
  </div>

  <!-- ─── Top 5 CVEs ─── -->
  <div class="section">
    <div class="section-header">
      <div class="icon icon-cve">&#9888;</div>
      <h2>Top 5 CVEs by CVSS Score</h2>
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width:32px;">#</th>
            <th>CVE ID</th>
            <th style="width:60px;text-align:center;">CVSS</th>
            <th>Description</th>
            <th>Affected Asset</th>
            <th style="width:100px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${cveRows}
        </tbody>
      </table>
    </div>
  </div>

  <!-- ─── Active Threats ─── -->
  <div class="section">
    <div class="section-header">
      <div class="icon icon-threat">&#9888;</div>
      <h2>Active Threats Summary</h2>
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Threat ID</th>
            <th>Type</th>
            <th>Severity</th>
            <th>Source</th>
            <th>Detected At</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${threatRows}
        </tbody>
      </table>
    </div>
  </div>

  <!-- ─── Footer ─── -->
  <div class="footer">
    <p>This report was generated automatically by <span class="generated-by">CyberFrost Platform</span></p>
    <p>CyberFrost Preemptive ETLM — Confidential</p>
  </div>

</body>
</html>`;
}

// ──────────────────────────────────────
// POST /api/v1/reports/generate
// Accepts { tenantId, reportType, tenantName?, dateFrom?, dateTo? }
// Returns PDF as download
// ──────────────────────────────────────

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const body = generateReportSchema.parse(req.body);
    const {
      tenantId,
      reportType,
      tenantName = 'Default Tenant',
      dateFrom = '2026-07-01',
      dateTo = '2026-07-20',
    } = body;

    // Build the HTML template based on report type
    let html: string;

    switch (reportType) {
      case 'executive':
      default:
        html = buildExecutiveReportHtml({
          tenantName,
          dateFrom,
          dateTo,
          severity: getMockSeverityBreakdown(),
          topCves: getMockTopCves(),
          activeThreats: getMockActiveThreats(),
        });
        break;

      case 'technical':
        // For now, re-use executive template; real implementation will differ
        html = buildExecutiveReportHtml({
          tenantName,
          dateFrom,
          dateTo,
          severity: getMockSeverityBreakdown(),
          topCves: getMockTopCves(),
          activeThreats: getMockActiveThreats(),
        });
        break;

      case 'compliance':
        html = buildExecutiveReportHtml({
          tenantName,
          dateFrom,
          dateTo,
          severity: getMockSeverityBreakdown(),
          topCves: getMockTopCves(),
          activeThreats: getMockActiveThreats(),
        });
        break;

      case 'threat-hunt':
        html = buildExecutiveReportHtml({
          tenantName,
          dateFrom,
          dateTo,
          severity: getMockSeverityBreakdown(),
          topCves: getMockTopCves(),
          activeThreats: getMockActiveThreats(),
        });
        break;
    }

    // Launch Puppeteer and generate PDF
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      });
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
          format: 'A4',
          margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: '<span></span>',
          footerTemplate: `<div style="width:100%;text-align:center;font-size:10px;color:#8b949e;padding:0 20mm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
        });
        const filename = `security-report-${tenantId}-${reportType}-${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
        return;
      } finally {
        await browser.close();
      }
    } catch (pdfErr: any) {
      console.warn('[Report] Puppeteer unavailable, falling back to HTML:', pdfErr.message);
      const filename = `security-report-${tenantId}-${reportType}-${Date.now()}.html`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.end(html);
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'VALIDATION', details: err.errors });
      return;
    }
    console.error('[Report] Generation error:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to generate report' });
  }
});

export default router;
