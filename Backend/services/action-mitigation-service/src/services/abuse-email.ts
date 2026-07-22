/**
 * Abuse Report Email Generator
 * ==============================
 * Generates professional abuse report emails to send to hosting providers,
 * domain registrars, and cloud service providers when malicious content
 * is detected targeting client infrastructure.
 *
 * These templates comply with common abuse desk formats required by:
 *   - Cloudflare Trust & Safety
 *   - AWS Trust & Safety
 *   - Google Abuse
 *   - GoDaddy Abuse
 *   - Namecheap Abuse
 */

export interface AbuseReportData {
  victimDomain: string;         // Client domain being targeted
  maliciousUrl: string;         // The malicious/phishing URL
  maliciousIp: string;          // Hosting IP address
  threatType: string;           // PHISHING, MALWARE, TRADEMARK, etc.
  description: string;          // Detailed description of the abuse
  evidenceUrls: string[];       // Screenshots or proof URLs
  discoveredAt: string;         // ISO date of discovery
  reporterName: string;         // Reporter name / company
  reporterEmail: string;        // Reporter contact email
}

/**
 * Generate an abuse report email for hosting provider.
 */
export function generateAbuseEmail(data: AbuseReportData): {
  subject: string;
  to: string[];
  cc: string[];
  body: string;
} {
  const subject = `[URGENT] Abuse Report — ${data.threatType} Targeting ${data.victimDomain}`;

  const body = `
${'='.repeat(70)}
ABUSE REPORT — IMMEDIATE ACTION REQUIRED
${'='.repeat(70)}

Date:           ${new Date().toISOString()}
Reporter:       ${data.reporterName}
Contact:        ${data.reporterEmail}
Priority:       HIGH — Active ${data.threatType} Campaign

${'-'.repeat(70)}
DETAILS OF VIOLATION
${'-'.repeat(70)}

We are writing to report a ${data.threatType.toLowerCase()} attack hosted on your
infrastructure that is targeting our client, ${data.victimDomain}.

Malicious URL:  ${data.maliciousUrl}
IP Address:     ${data.maliciousIp}
Threat Type:    ${data.threatType}
Discovered:     ${data.discoveredAt}

${'-'.repeat(70)}
DESCRIPTION
${'-'.repeat(70)}

${data.description}

${data.evidenceUrls.length > 0 ? `
${'-'.repeat(70)}
EVIDENCE
${'-'.repeat(70)}
${data.evidenceUrls.map((url, i) => `  [${i + 1}] ${url}`).join('\n')}
` : ''}
${'-'.repeat(70)}
REQUESTED ACTION
${'-'.repeat(70)}

1. Immediately investigate and take down the content hosted at:
   ${data.maliciousUrl}

2. Preserve all logs related to this incident for potential
   law enforcement investigation.

3. Confirm receipt of this report within 24 hours.

${'-'.repeat(70)}
CONTACT INFORMATION
${'-'.repeat(70)}

Reporter: ${data.reporterName}
Email:    ${data.reporterEmail}

This report is submitted in accordance with your acceptable use
policy and applicable laws regarding cybercrime and intellectual
property infringement.

${'='.repeat(70)}
END OF REPORT
${'='.repeat(70)}
  `.trim();

  return {
    subject,
    to: [`abuse@${extractDomain(data.maliciousUrl)}`, `hostmaster@${extractDomain(data.maliciousUrl)}`],
    cc: [data.reporterEmail],
    body,
  };
}

/**
 * Generate an abuse report for domain registrar (typo-squatting / trademark).
 */
export function generateDomainAbuseEmail(data: AbuseReportData): {
  subject: string;
  to: string[];
  cc: string[];
  body: string;
} {
  const subject = `[TRADEMARK VIOLATION] Domain ${new URL(data.maliciousUrl).hostname} Impersonating ${data.victimDomain}`;
  const domain = new URL(data.maliciousUrl).hostname;

  const body = `
${'='.repeat(70)}
TRADEMARK / PHISHING REPORT — DOMAIN REGISTRAR
${'='.repeat(70)}

Date:     ${new Date().toISOString()}
Reporter: ${data.reporterName}

${'-'.repeat(70)}
VIOLATING DOMAIN
${'-'.repeat(70)}

  Domain:       ${domain}
  Target URL:   ${data.maliciousUrl}
  IP Address:   ${data.maliciousIp}
  Victim Brand: ${data.victimDomain}

${'-'.repeat(70)}
NATURE OF VIOLATION
${'-'.repeat(70)}

The domain ${domain} is actively being used to impersonate
${data.victimDomain} in a ${data.threatType.toLowerCase()} campaign.
This constitutes a trademark violation and poses a significant
security risk to users of ${data.victimDomain}.

${data.description}

${'-'.repeat(70)}
REQUESTED ACTION
${'-'.repeat(70)}

We request the immediate suspension of the domain ${domain}
pursuant to your terms of service and applicable anti-cybersquatting
regulations.

${'-'.repeat(70)}
CONTACT
${'-'.repeat(70)}

  Reporter: ${data.reporterName}
  Email:    ${data.reporterEmail}

${'='.repeat(70)}
END OF REPORT
${'='.repeat(70)}
  `.trim();

  return {
    subject,
    to: [`abuse@${getRegistrarAbuseEmail(domain)}`],
    cc: [data.reporterEmail],
    body,
  };
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getRegistrarAbuseEmail(_domain: string): string {
  // In production: look up WHOIS to find the actual registrar
  return 'abuse@namecheap.com';
}
