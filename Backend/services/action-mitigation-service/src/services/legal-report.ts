/**
 * Legal Report Generator — Social Media Takedown
 * =================================================
 * Enhanced Meta (Facebook/Instagram) legal templates formatted
 * as 100% valid abuse reports that platform legal teams will read & action.
 *
 * Reference: Meta Brand Rights Protection, Community Standards,
 *            Instagram ToS, Facebook ToS, DMCA, Trademark Law
 */

export interface SocialMediaReportData {
  profileUrl: string;
  platform: string;
  impersonatedEntity: string;
  description: string;
  evidenceUrls: string[];
  reporterName: string;
  reporterEmail: string;
  discoveredAt: string;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

const DIVIDER = '===================================================================================================';

// -------------------------------------------------------------------------------------------
//  FACEBOOK (META) — Formal Legal Impersonation / IP Report
// -------------------------------------------------------------------------------------------
export function generateFacebookReport(data: SocialMediaReportData): string {
  const date = formatDate(data.discoveredAt);
  const ref = `META-FB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const evidenceSection = data.evidenceUrls.length > 0
    ? data.evidenceUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')
    : 'Documentation and screenshots available upon request.';

  return `
${DIVIDER}
  META PLATFORMS, INC. — FORMAL INFRINGEMENT / IMPERSONATION REPORT
  Notice pursuant to Meta Community Standards & Terms of Service
${DIVIDER}

DATE OF REPORT:     ${date}
REFERENCE NUMBER:   ${ref}
REPORT TYPE:        Impersonation / Trademark Infringement / Fraud
URGENCY:            HIGH — Active harm to brand and consumers

TO: Meta Platforms, Inc. — Trust & Safety / Brand Rights Protection
    Abuse Team — abuse@facebookmail.com
    Menlo Park, CA, United States

FROM: ${data.reporterName}
      ${data.reporterEmail}
      Authorized Representative of ${data.impersonatedEntity}

===================================================================================================

SUBJECT: URGENT — Immediate Takedown Request: Impersonating Profile

===================================================================================================

Dear Meta Trust & Safety Team,

We are writing as the authorized representative of ${data.impersonatedEntity}
to formally report a violation of Meta's Community Standards and Terms of Service.
The profile identified below is engaged in impersonation and/or trademark
infringement causing active harm to our brand and our community.

===================================================================================================
I. REPORTED ENTITY
===================================================================================================

  Platform:          Meta / Facebook
  Profile URL:       ${data.profileUrl}
  Impersonated:      ${data.impersonatedEntity}
  Threat Category:   Impersonation / Brand Impersonation
  Date Discovered:   ${date}

===================================================================================================
II. NATURE OF VIOLATION
===================================================================================================

  This profile is using the name, brand identity, and/or intellectual property
  of ${data.impersonatedEntity} without authorization. This constitutes:

  A. Impersonation — Violation of Meta Community Standard 11 (Misrepresentation)
     • Using the name and likeness of ${data.impersonatedEntity} to deceive others
     • Misrepresenting the identity of the account holder
     • Creating a false sense of affiliation or endorsement

  B. Trademark Infringement — Violation of Meta Brand Usage Policy
     • Unauthorized use of registered/protected marks
     • Consumer confusion as to source or affiliation
     • Dilution of brand value and reputation

  C. Fraud / Deceptive Practices — Violation of Meta Community Standard 5 (Fraud)
     • Potential phishing, scam, or deceptive solicitation
     • Risk to consumers who may be misled by the impersonating entity
     • Reputational and financial harm to ${data.impersonatedEntity}

===================================================================================================
III. DETAILED DESCRIPTION
===================================================================================================

  ${data.description}

===================================================================================================
IV. SUPPORTING EVIDENCE
===================================================================================================

  ${evidenceSection}

===================================================================================================
V. LEGAL BASIS & POLICY REFERENCES
===================================================================================================

  This report is submitted pursuant to:

  1. Meta Community Standards — Section 11: Misrepresentation
  2. Meta Brand Usage Policy — Trademark & Copyright
  3. Facebook Terms of Service — Section 3: Safety
  4. Digital Millennium Copyright Act (DMCA) — 17 U.S.C. § 512 (if applicable)
  5. Lanham Act — 15 U.S.C. § 1125(a): False Designations of Origin
  6. Applicable local trademark and anti-impersonation laws

===================================================================================================
VI. REQUESTED ACTION
===================================================================================================

  1. IMMEDIATE SUSPENSION of the reported profile/account
  2. Removal of all infringing content associated with the account
  3. Written acknowledgment of receipt within 48 hours
  4. Case reference number for ongoing tracking

  This notice is made in good faith pursuant to Section 512(c)(3) of the
  Digital Millennium Copyright Act (if applicable) and Meta's reporting
  mechanisms. We certify that the information in this notification is
  accurate and that we are authorized to act on behalf of the rights owner.

===================================================================================================
VII. CERTIFICATION
===================================================================================================

  I hereby certify that the information contained in this report is true,
  accurate, and complete to the best of my knowledge. I am authorized to
  submit this report on behalf of ${data.impersonatedEntity}.

  Signed: ${data.reporterName}
  Title:  Authorized Representative
  Email:  ${data.reporterEmail}
  Date:   ${date}

  ----------------------------------------------------------------------
  ${data.reporterName} • ${data.reporterEmail}
  CyberFrost Security Platform • Automated Brand Protection
  Reference: ${ref}
  ----------------------------------------------------------------------

${DIVIDER}
  END OF REPORT — Meta reference ${ref}
${DIVIDER}
`;
}

// -------------------------------------------------------------------------------------------
//  INSTAGRAM (META) — Formal Legal Impersonation / IP Report
// -------------------------------------------------------------------------------------------
export function generateInstagramReport(data: SocialMediaReportData): string {
  const date = formatDate(data.discoveredAt);
  const ref = `META-IG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const evidenceSection = data.evidenceUrls.length > 0
    ? data.evidenceUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')
    : 'Documentation and screenshots available upon request.';

  return `
${DIVIDER}
  META PLATFORMS, INC. (INSTAGRAM) — FORMAL IMPERSONATION / IP REPORT
  Notice pursuant to Instagram Community Guidelines & Terms of Use
${DIVIDER}

DATE OF REPORT:     ${date}
REFERENCE NUMBER:   ${ref}
REPORT TYPE:        Impersonation / Trademark Infringement
URGENCY:            HIGH — Active harm to brand and community

TO: Instagram — Trust & Safety / Brand Rights Protection
    c/o Meta Platforms, Inc.
    Abuse Report: abuse@facebookmail.com
    1 Meta Way, Menlo Park, CA 94025

FROM: ${data.reporterName}
      ${data.reporterEmail}
      Authorized Representative of ${data.impersonatedEntity}

===================================================================================================

SUBJECT: URGENT — Immediate Takedown Request: Impersonating Instagram Account

===================================================================================================

Dear Instagram Trust & Safety Team,

We are writing as the authorized representative of ${data.impersonatedEntity}
to formally report a violation of Instagram's Community Guidelines and Terms
of Use. The account identified below is engaged in impersonation and/or
trademark infringement, causing active harm to our brand.

===================================================================================================
I. REPORTED ENTITY
===================================================================================================

  Platform:          Instagram (Meta)
  Account URL:       ${data.profileUrl}
  Impersonated:      ${data.impersonatedEntity}
  Threat Category:   Impersonation / Brand Impersonation
  Date Discovered:   ${date}

===================================================================================================
II. NATURE OF VIOLATION
===================================================================================================

  This Instagram account is using the name, brand identity, and/or
  intellectual property of ${data.impersonatedEntity} without authorization.
  This constitutes:

  A. Impersonation — Violation of Instagram Community Guidelines
     • Impersonation: pretending to be someone else
     • Community Guidelines Section: "Impersonation"
     • Creating a false affiliation with ${data.impersonatedEntity}

  B. Trademark Infringement — Instagram Brand Policy
     • Unauthorized use of registered marks, logos, or branding
     • Consumer confusion as to affiliation or endorsement
     • Brand dilution and reputational damage

  C. Potential Fraud / Deception
     • Risk of misleading followers and the broader community
     • Possible phishing, scam, or deceptive activities
     • Harm to the trusted relationship with our audience

===================================================================================================
III. DETAILED DESCRIPTION
===================================================================================================

  ${data.description}

===================================================================================================
IV. SUPPORTING EVIDENCE
===================================================================================================

  ${evidenceSection}

===================================================================================================
V. LEGAL BASIS & POLICY REFERENCES
===================================================================================================

  This report is submitted pursuant to:

  1. Instagram Community Guidelines — Impersonation Policy
  2. Instagram Terms of Use — Section 4: Rights & Prohibitions
  3. Meta Brand Usage Policy — Trademark & Intellectual Property
  4. Digital Millennium Copyright Act (DMCA) — 17 U.S.C. § 512 (if applicable)
  5. Lanham Act — 15 U.S.C. § 1125(a): False Designations of Origin
  6. Applicable local trademark and anti-impersonation laws

===================================================================================================
VI. REQUESTED ACTION
===================================================================================================

  1. IMMEDIATE SUSPENSION of the reported Instagram account
  2. Removal of all infringing content (posts, stories, bio)
  3. Written acknowledgment of receipt — please provide a case reference
  4. Notification upon completion of enforcement action

  This notice is made in good faith and we certify that the information
  contained herein is accurate. We are authorized to act on behalf of
  ${data.impersonatedEntity}.

===================================================================================================
VII. CERTIFICATION
===================================================================================================

  I hereby certify that the information contained in this report is true,
  accurate, and complete to the best of my knowledge. I am authorized to
  submit this report on behalf of ${data.impersonatedEntity}.

  Signed: ${data.reporterName}
  Title:  Authorized Representative — Brand Protection
  Email:  ${data.reporterEmail}
  Date:   ${date}

  ----------------------------------------------------------------------
  ${data.reporterName} • ${data.reporterEmail}
  CyberFrost Security Platform • Automated Brand Protection
  Reference: ${ref}
  ----------------------------------------------------------------------

${DIVIDER}
  END OF REPORT — Instagram reference ${ref}
${DIVIDER}
`;
}

// -------------------------------------------------------------------------------------------
//  X / TWITTER — Formal Impersonation Report
// -------------------------------------------------------------------------------------------
export function generateTwitterReport(data: SocialMediaReportData): string {
  const date = formatDate(data.discoveredAt);
  const ref = `X-${Date.now().toString(36).toUpperCase()}`;
  const evidenceSection = data.evidenceUrls.length > 0
    ? data.evidenceUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')
    : 'Documentation available upon request.';

  return `
${DIVIDER}
  X CORP. — FORMAL IMPERSONATION REPORT
  Notice pursuant to X Rules & Terms of Service
${DIVIDER}

REFERENCE:       ${ref}
DATE:            ${date}
REPORT TYPE:     Impersonation / Platform Manipulation

TO: X Corp. Trust & Safety

FROM: ${data.reporterName}
      ${data.reporterEmail}
      Representative of ${data.impersonatedEntity}

===================================================================================================

SUBJECT: Impersonation Report — @${data.profileUrl.split('/').pop() || data.profileUrl}

===================================================================================================

This is a formal report of impersonation on the X platform.

  Impersonated Entity:  ${data.impersonatedEntity}
  Impersonating Account: ${data.profileUrl}
  Date Discovered:      ${date}
  Policy Violation:     X Rules — Platform Manipulation & Impersonation

  ${data.description}

EVIDENCE:
  ${evidenceSection}

LEGAL BASIS:
  • X Rules: Impersonation Policy — Accounts posing as another entity
  • Platform Manipulation and Spam Policy
  • Applicable trademark and anti-impersonation laws

We request the immediate suspension of the above account.

----------------------------------------------------------------------
${data.reporterName}
${data.reporterEmail}
CyberFrost Security Platform | Ref: ${ref}
----------------------------------------------------------------------
`;
}

// -------------------------------------------------------------------------------------------
//  LINKEDIN — Formal Impersonation Report
// -------------------------------------------------------------------------------------------
export function generateLinkedInReport(data: SocialMediaReportData): string {
  const date = formatDate(data.discoveredAt);
  const ref = `LI-${Date.now().toString(36).toUpperCase()}`;
  const evidenceSection = data.evidenceUrls.length > 0
    ? data.evidenceUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')
    : 'Documentation available upon request.';

  return `
${DIVIDER}
  LINKEDIN CORP. — FORMAL FAKE PROFILE / IMPERSONATION REPORT
  Notice pursuant to LinkedIn User Agreement & Policies
${DIVIDER}

REFERENCE:       ${ref}
DATE:            ${date}

TO: LinkedIn Trust & Safety

FROM: ${data.reporterName}
      ${data.reporterEmail}
      Representative of ${data.impersonatedEntity}

===================================================================================================

SUBJECT: Fake Profile Report — Impersonation of ${data.impersonatedEntity}

===================================================================================================

  Fake Profile URL: ${data.profileUrl}
  Impersonates:     ${data.impersonatedEntity}
  Date Reported:    ${date}

  ${data.description}

  This profile violates LinkedIn's policies on fake profiles and
  misleading content. The account is misrepresenting its affiliation
  with ${data.impersonatedEntity}.

EVIDENCE:
  ${evidenceSection}

  We request prompt investigation and removal of this fake profile.

----------------------------------------------------------------------
${data.reporterName}
${data.reporterEmail}
CyberFrost Security Platform | Ref: ${ref}
----------------------------------------------------------------------
`;
}

// -------------------------------------------------------------------------------------------
//  GENERIC / FALLBACK — Social Media Report
// -------------------------------------------------------------------------------------------
function generateSocialMediaReport(data: SocialMediaReportData): string {
  const date = formatDate(data.discoveredAt);
  const evidence = data.evidenceUrls.length > 0
    ? `\nEvidence URLs:\n${data.evidenceUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}`
    : '';
  const ref = `SM-${Date.now().toString(36).toUpperCase()}`;

  return `
${DIVIDER}
  SOCIAL MEDIA TAKEDOWN REPORT — ${data.platform.toUpperCase()}
${DIVIDER}

REFERENCE:       ${ref}
DATE:            ${date}
PLATFORM:        ${data.platform}
PROFILE URL:     ${data.profileUrl}
IMPERSONATING:   ${data.impersonatedEntity}
REPORTED BY:     ${data.reporterName} (${data.reporterEmail})

DESCRIPTION:
  ${data.description}${evidence}

LEGAL BASIS:
  This report is submitted in accordance with the platform's terms
  of service and applicable laws regarding impersonation, trademark
  infringement, and fraud. We request immediate takedown of the
  reported profile.

----------------------------------------------------------------------
${data.reporterName} • ${data.reporterEmail}
CyberFrost Security Platform | Ref: ${ref}
----------------------------------------------------------------------
`;
}

// -------------------------------------------------------------------------------------------
//  PLATFORM DISPATCH — Route to correct template
// -------------------------------------------------------------------------------------------
export function generatePlatformReport(data: SocialMediaReportData): string {
  switch (data.platform) {
    case 'FACEBOOK':    return generateFacebookReport(data);
    case 'INSTAGRAM':   return generateInstagramReport(data);
    case 'TWITTER':     return generateTwitterReport(data);
    case 'LINKEDIN':    return generateLinkedInReport(data);
    default:            return generateSocialMediaReport(data);
  }
}
