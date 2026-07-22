import Handlebars from 'handlebars';

const LEGAL_TEMPLATE = `
===============================================================================
  FORMAL NOTICE OF IMPERSONATION & INFRINGEMENT
  Pursuant to Platform Terms of Service & Applicable Law
===============================================================================

REFERENCE:       CYF-{{refId}}
DATE:            {{date}}
REPORT TYPE:     Impersonation / Trademark Infringement
URGENCY:         HIGH

TO: {{platform}} Legal Department / Trust & Safety Team
    Abuse Report Processing

FROM: {{reporterName}}
      {{reporterEmail}}
      Authorized Representative of {{impersonatedEntity}}

===================================================================================================

SUBJECT: IMMEDIATE TAKEDOWN REQUEST — Impersonation of {{impersonatedEntity}}

===================================================================================================

Dear Trust & Safety Team,

We are writing as the authorized representative of {{impersonatedEntity}}
to formally report a violation of your platform's Terms of Service and
Community Guidelines. The profile/account identified below is engaged in
unauthorized use of our brand identity.

===================================================================================================
I. REPORTED ENTITY
===================================================================================================

  Platform:              {{platform}}
  Profile / Account URL: {{profileUrl}}
  Impersonated Entity:   {{impersonatedEntity}}
  Threat Type:           {{threatType}}
  Date Discovered:       {{discoveredAt}}

===================================================================================================
II. POLICY VIOLATIONS
===================================================================================================

  This account/profile is in violation of the following policies:

  A. IMPERSONATION / MISREPRESENTATION
     — Using the name, likeness, and brand identity of
       {{impersonatedEntity}} without authorization
     — Misrepresenting affiliation or endorsement
     — Violation of platform Community Standards / Guidelines

  B. TRADEMARK INFRINGEMENT
     — Unauthorized use of registered/protected marks
     — Consumer confusion as to source or sponsorship
     — Brand dilution and reputational damage

  C. POTENTIAL FRAUD / DECEPTIVE PRACTICES
     — Risk to consumers who may be misled
     — Possible phishing, scam, or fraudulent activities
     — Harm to public trust and brand reputation

===================================================================================================
III. DETAILED DESCRIPTION
===================================================================================================

  {{description}}

===================================================================================================
IV. SUPPORTING EVIDENCE
===================================================================================================

{{#if evidenceUrls}}
  The following evidence is provided in support of this report:
  {{#each evidenceUrls}}
  {{@index}}) {{this}}
  {{/each}}
{{else}}
  Screenshots, profile documentation, and additional evidence are
  available upon request or can be provided via secure link.
{{/if}}

===================================================================================================
V. LEGAL BASIS
===================================================================================================

  This report is submitted pursuant to:

  1. Platform Terms of Service — Impersonation & Misrepresentation
  2. Community Guidelines / Standards — Fake Account Policy
  3. Brand Rights Protection Policy
  4. Applicable Trademark Law (Lanham Act 15 U.S.C. § 1125)
  5. Digital Millennium Copyright Act (17 U.S.C. § 512) where applicable
  6. Local laws regarding fraud and deceptive practices

===================================================================================================
VI. REQUESTED ACTION
===================================================================================================

  1. IMMEDIATE SUSPENSION of the reported account/profile
  2. Removal of all infringing content and materials
  3. Written acknowledgment of this report
  4. Case reference number for tracking

  We certify that the information in this notification is accurate and
  that we are authorized to act on behalf of {{impersonatedEntity}}.
  This notice is made in good faith pursuant to applicable reporting
  mechanisms and safe harbor provisions.

===================================================================================================
VII. CERTIFICATION
===================================================================================================

  I hereby certify that the above information is true and accurate.
  I am authorized to submit this report on behalf of the rights holder.

  Signed:   {{reporterName}}
  Title:    Authorized Representative — Brand Protection
  Email:    {{reporterEmail}}
  Date:     {{date}}

  -------------------------------------------------------
  {{reporterName}} • {{reporterEmail}}
  CyberFrost Security Platform • Automated Brand Protection
  Reference: CYF-{{refId}}
  -------------------------------------------------------

===============================================================================
  END OF REPORT — Reference CYF-{{refId}}
===============================================================================
`;

const template = Handlebars.compile(LEGAL_TEMPLATE);

export interface LegalDraftInput {
  reporterName: string;
  reporterEmail: string;
  platform: string;
  profileUrl: string;
  impersonatedEntity: string;
  threatType: string;
  discoveredAt: string;
  description: string;
  evidenceUrls: string[];
  date: string;
}

const KOMINFO_TEMPLATE = `
===============================================================================
  LAPORAN RESMI — PERMOHONAN PEMBLOKIRAN SITUS/KONTEN
  Berdasarkan UU ITE & Peraturan Menteri Kominfo
===============================================================================

REFERENCE:       KOMINFO-{{refId}}
TANGGAL:         {{date}}
JENIS LAPORAN:   {{threatType}}
URGENSI:         TINGGI

KEPADA YTH:
  Tim Aduan Konten / Trust+ Positif
  Kementerian Komunikasi dan Informatika RI
  Email: aduankonten@kominfo.go.id
  Jl. Medan Merdeka Barat No. 9, Jakarta 10110

DILAPORKAN OLEH:
  Nama:    {{reporterName}}
  Email:   {{reporterEmail}}
  Atas Nama: {{impersonatedEntity}}

===================================================================================================

PERIHAL: PERMOHONAN PEMBLOKIRAN SITUS/KONTEN BERBAHAYA

===================================================================================================

Yang bertanda tangan di bawah ini, selaku perwakilan dari
{{impersonatedEntity}}, dengan ini mengajukan permohonan pemblokiran
terhadap konten/situs yang melanggar ketentuan peraturan perundang-undangan.

===================================================================================================
I. INFORMASI TARGET
===================================================================================================

  URL / Situs:          {{profileUrl}}
  Platform:             {{platform}}
  Jenis Ancaman:        {{threatType}}
  Atas Nama:            {{impersonatedEntity}}
  Tanggal Ditemukan:    {{discoveredAt}}

===================================================================================================
II. DESKRIPSI / URAIAN
===================================================================================================

  {{description}}

===================================================================================================
III. DASAR HUKUM
===================================================================================================

  Konten/situs tersebut melanggar ketentuan:

  1. Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan
     Transaksi Elektronik (UU ITE) beserta perubahannya
  2. Peraturan Menteri Kominfo terkait konten negatif dan
     situs terlarang
  3. Peraturan Menteri Kominfo No. 19 Tahun 2014 tentang
     Penanganan Situs Internet Bermuatan Negatif
  4. Kitab Undang-Undang Hukum Pidana (KUHP)
  5. Dapat menimbulkan kerugian bagi konsumen, masyarakat,
     dan/atau pelaku usaha

===================================================================================================
IV. BUKTI PENDUKUNG
===================================================================================================

{{#if evidenceUrls}}
  Bukti screenshot dan dokumentasi dapat diakses melalui:
  {{#each evidenceUrls}}
  {{@index}}) {{this}}
  {{/each}}
{{else}}
  Screenshot dan dokumentasi pendukung tersedia dan akan
  diberikan apabila diperlukan oleh Tim Kominfo.
{{/if}}

===================================================================================================
V. PERMOHONAN
===================================================================================================

  Bersama ini kami memohon:

  1. Pemblokiran terhadap situs/URL tersebut di atas melalui
     sistem Trust+ Positif Kominfo
  2. Pemeriksaan dan verifikasi konten yang dilaporkan
  3. Tindak lanjut sesuai ketentuan yang berlaku

  Demikian laporan ini kami sampaikan. Atas perhatian dan
  kerjasamanya, kami ucapkan terima kasih.

  Hormat kami,

  {{reporterName}}
  {{reporterEmail}}
  CyberFrost Security Platform
  Reference: KOMINFO-{{refId}}

===============================================================================
  AKHIR LAPORAN — Referensi KOMINFO-{{refId}}
===============================================================================
`;

const kominfoTemplate = Handlebars.compile(KOMINFO_TEMPLATE);

function generateRefId(): string {
  return `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export function generateKominfoDraft(data: LegalDraftInput): string {
  return kominfoTemplate({
    ...data,
    refId: generateRefId(),
    date: data.date || new Date().toISOString().split('T')[0],
    evidenceUrls: data.evidenceUrls || [],
  });
}

export function detectRouting(platform: string, socialPlatform?: string): { to: string; subject: string; draft: (data: LegalDraftInput) => string } {
  if (platform === 'KOMINFO_TRUST_POSITIF' || socialPlatform === 'KOMINFO_TRUST_POSITIF') {
    return {
      to: 'aduankonten@kominfo.go.id',
      subject: `[Pelaporan Ancaman Siber] Permohonan Pemblokiran Situs`,
      draft: generateKominfoDraft,
    };
  }

  // Meta platforms → use enhanced template
  if (socialPlatform === 'FACEBOOK') {
    return {
      to: 'abuse@facebookmail.com',
      subject: `[URGENT] [FB] Impersonation Report — Immediate Takedown Required`,
      draft: generateLegalDraft,
    };
  }

  if (socialPlatform === 'INSTAGRAM') {
    return {
      to: 'abuse@facebookmail.com',
      subject: `[URGENT] [IG] Impersonation Report — Immediate Takedown Required`,
      draft: generateLegalDraft,
    };
  }

  return {
    to: 'abuse@platform.com',
    subject: 'URGENT: Impersonation Notice — Immediate Action Required',
    draft: generateLegalDraft,
  };
}

export function generateLegalDraft(data: LegalDraftInput): string {
  return template({
    ...data,
    refId: generateRefId(),
    date: data.date || new Date().toISOString().split('T')[0],
    evidenceUrls: data.evidenceUrls || [],
  });
}
