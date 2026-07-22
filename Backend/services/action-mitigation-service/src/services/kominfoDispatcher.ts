/**
 * Kominfo Email Dispatcher — SOAR One-Click Takedown ke Kominfo
 * ==============================================================
 * Format dan kirim laporan pemblokiran situs/konten ke
 * Kementerian Kominfo RI via aduankonten@kominfo.go.id
 *
 * Mematuhi:
 *  - Format Subject: [LAPORAN {Kategori Ancaman}] {Nama Klien/Entitas} - Segera Tindak Lanjut
 *  - Body: Template 5W1H formal (HTML)
 *  - Lampiran: Maksimal 5MB
 */

import { dispatchLegalEmail } from './mailer';

// ─── SSRF Guard ───────────────────────────────────────────────────────────────

function validateUrlAgainstSSRF(urlString: string): { valid: boolean; reason?: string } {
  const BLOCKED_HOSTNAMES = ['localhost', '127.0.0.1', '::1', '0.0.0.0', 'metadata.google.internal'];
  const BLOCKED_IP_PATTERNS = [
    (ip: string) => ip.startsWith('10.'),
    (ip: string) => ip.startsWith('127.'),
    (ip: string) => ip.startsWith('192.168.'),
    (ip: string) => /^172\.(1[6-9]|2\d|3[01])\./.test(ip),
    (ip: string) => ip.startsWith('169.254.'),
    (ip: string) => ip === '0.0.0.0' || ip === '::1',
  ];
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { valid: false, reason: `Protocol '${parsed.protocol}' not allowed` };
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) return { valid: false, reason: `Access to '${hostname}' blocked (internal).` };
    const { isIP } = require('net');
    if (isIP(hostname)) {
      for (const check of BLOCKED_IP_PATTERNS) { if (check(hostname)) return { valid: false, reason: `Private IP '${hostname}' blocked.` }; }
    }
    return { valid: true };
  } catch { return { valid: false, reason: 'Invalid URL' }; }
}

// ─── Konstanta ───────────────────────────────────────────────────────────────

const KOMINFO_EMAIL = 'aduankonten@kominfo.go.id';
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB

const THREAT_LABEL_MAP: Record<string, string> = {
  PHISHING: 'PHISHING',
  PHISHING_BANK_LOKAL: 'PHISHING',
  MALWARE: 'MALWARE',
  TRADEMARK: 'PELANGGARAN MEREK',
  COPYRIGHT: 'HAK CIPTA',
  FRAUD: 'PENIPUAN',
  JUDI_ONLINE: 'JUDI ONLINE',
  PENIPUAN_TRANSAKSI: 'PENIPUAN',
  IMPERSONATION: 'PENIRUAN IDENTITAS',
  DEFAULT: 'SIBER',
};

// ─── Antarmuka ───────────────────────────────────────────────────────────────

export interface KominfoDispatchPayload {
  /** Nama pelapor / perusahaan */
  reporterName: string;
  /** Email pelapor */
  reporterEmail: string;
  /** Nama entitas / klien yang dirugikan (untuk subject & body) */
  impersonatedEntity: string;
  /** Kategori ancaman (PHISHING, MALWARE, TRADEMARK, dll) */
  threatType: string;
  /** URL target yang dilaporkan */
  targetUrl: string;
  /** Domain target */
  domain: string;
  /** Deskripsi / konteks pelanggaran */
  description: string;
  /** URL bukti pendukung (screenshot, PDF, dll) */
  evidenceUrls: string[];
  /** Timestamp ISO penemuan */
  discoveredAt: string;
  /** Tanggal dalam format YYYY-MM-DD */
  date: string;
}

export interface AttachmentInfo {
  filename: string;
  content: Buffer;
  contentType: string;
  size: number;
}

export interface KominfoDispatchResult {
  success: boolean;
  subject: string;
  refId: string;
  messageId?: string;
  attachmentCount: number;
  attachmentTotalBytes: number;
  attachmentOversized: boolean;
  error?: string;
}

// ─── Helper: Buat Reference ID ───────────────────────────────────────────────

function generateRefId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KOMINFO-${ts}-${rand}`;
}

// ─── Helper: Map threat type ke label Indonesia ──────────────────────────────

function mapThreatLabel(threatType: string): string {
  return THREAT_LABEL_MAP[threatType?.toUpperCase()] || THREAT_LABEL_MAP.DEFAULT;
}

// ─── 1. Format Subject (WAJIB kaku) ──────────────────────────────────────────

/**
 * Format subjek email persyaratan Kominfo:
 *   [LAPORAN {Kategori Ancaman}] {Nama Klien/Entitas} - Segera Tindak Lanjut
 *
 * Contoh:
 *   [LAPORAN PHISHING] Bank Mandiri - Segera Tindak Lanjut
 *   [LAPORAN JUDI ONLINE] Situs Judi Slot777 - Segera Tindak Lanjut
 */
export function generateKominfoSubject(threatType: string, entityName: string): string {
  const label = mapThreatLabel(threatType);
  // Bersihkan entityName: hapus karakter aneh, batasi panjang
  const clean = entityName
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/[<>"']/g, '')
    .trim()
    .substring(0, 80);
  return `[LAPORAN ${label}] ${clean} - Segera Tindak Lanjut`;
}

// ─── 2. Format Body (5W1H — HTML) ────────────────────────────────────────────

/**
 * Buat body HTML formal dengan struktur 5W1H untuk Kominfo.
 * DILARANG hyperlink URL target (plain text) untuk hindari spam filter.
 */
export function generateKominfoBodyHtml(payload: KominfoDispatchPayload, refId: string): string {
  const threatLabel = mapThreatLabel(payload.threatType);

  // Format evidence list
  const evidenceList = payload.evidenceUrls.length > 0
    ? payload.evidenceUrls.map((url, i) =>
        `<tr><td style="padding:4px 8px;font-family:monospace;font-size:12px;color:#333;">${i + 1}.</td><td style="padding:4px 8px;font-family:monospace;font-size:11px;color:#555;word-break:break-all;">${url}</td></tr>`
      ).join('')
    : '<tr><td colspan="2" style="padding:8px;font-family:sans-serif;font-size:12px;color:#888;text-align:center;">— Belum ada bukti tambahan —</td></tr>';

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Laporan Pemblokiran — ${refId}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">

<table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:20px auto;background:#ffffff;border:1px solid #ddd;border-radius:4px;">

  <!-- HEADER: KOP -->
  <tr>
    <td style="padding:30px 30px 20px;background:#1a237e;border-radius:4px 4px 0 0;">
      <h1 style="margin:0;font-size:18px;color:#ffffff;font-weight:700;letter-spacing:1px;">LAPORAN RESMI — PERMOHONAN PEMBLOKIRAN</h1>
      <p style="margin:6px 0 0;font-size:12px;color:#9fa8da;font-weight:400;">Kementerian Komunikasi dan Informatika RI — Trust+ Positif</p>
    </td>
  </tr>

  <!-- REFERENCE -->
  <tr>
    <td style="padding:16px 30px;background:#e8eaf6;border-bottom:1px solid #c5cae9;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:12px;color:#1a237e;font-weight:700;font-family:monospace;">REF: ${refId}</td>
          <td style="font-size:12px;color:#555;text-align:right;font-family:monospace;">TANGGAL: ${payload.date}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BADGE URGENSI -->
  <tr>
    <td style="padding:12px 30px;background:#ffebee;border-bottom:1px solid #ffcdd2;">
      <span style="display:inline-block;padding:4px 14px;font-size:11px;font-weight:700;color:#b71c1c;background:#ffcdd2;border-radius:3px;">URGENSI: TINGGI — SEGERA DITINDAK LANJUTI</span>
    </td>
  </tr>

  <!-- ISI LAPORAN: 5W1H -->
  <tr>
    <td style="padding:24px 30px;">

      <!-- APA (What) — Kategori Pelanggaran -->
      <h2 style="margin:0 0 6px;font-size:13px;color:#1a237e;text-transform:uppercase;letter-spacing:0.5px;">A. APA JENIS PELANGGARAN?</h2>
      <p style="margin:0 0 16px;font-size:13px;color:#333;line-height:1.5;">
        Dilaporkan adanya <strong>${threatLabel}</strong> yang melanggar ketentuan peraturan perundang-undangan.<br>
        Kategori Ancaman: <strong>${payload.threatType}</strong>
      </p>

      <!-- SIAPA (Who) — Pelapor & Entitas Terlapor -->
      <h2 style="margin:0 0 6px;font-size:13px;color:#1a237e;text-transform:uppercase;letter-spacing:0.5px;">B. SIAPA PELAPOR DAN PIHAK TERKAIT?</h2>
      <table width="100%" cellpadding="4" cellspacing="0" style="margin:0 0 16px;font-size:13px;color:#333;">
        <tr><td width="140" style="padding:3px 8px;background:#f5f5f5;font-weight:600;">Pelapor</td><td style="padding:3px 8px;">${payload.reporterName}</td></tr>
        <tr><td width="140" style="padding:3px 8px;background:#f5f5f5;font-weight:600;">Email Pelapor</td><td style="padding:3px 8px;">${payload.reporterEmail}</td></tr>
        <tr><td width="140" style="padding:3px 8px;background:#f5f5f5;font-weight:600;">Atas Nama</td><td style="padding:3px 8px;"><strong>${payload.impersonatedEntity}</strong></td></tr>
      </table>

      <!-- DIMANA (Where) — URL Target (PLAIN TEXT, TIDAK DI-HYPERLINK) -->
      <h2 style="margin:0 0 6px;font-size:13px;color:#1a237e;text-transform:uppercase;letter-spacing:0.5px;">C. DI MANA LOKASI TARGET?</h2>
      <table width="100%" cellpadding="4" cellspacing="0" style="margin:0 0 16px;font-size:13px;color:#333;">
        <tr><td width="140" style="padding:3px 8px;background:#f5f5f5;font-weight:600;">URL / Situs</td><td style="padding:3px 8px;font-family:monospace;font-size:12px;color:#c62828;word-break:break-all;">${payload.targetUrl}</td></tr>
        <tr><td width="140" style="padding:3px 8px;background:#f5f5f5;font-weight:600;">Domain</td><td style="padding:3px 8px;font-family:monospace;font-size:12px;color:#333;">${payload.domain}</td></tr>
      </table>

      <!-- KAPAN (When) — Waktu Discovery -->
      <h2 style="margin:0 0 6px;font-size:13px;color:#1a237e;text-transform:uppercase;letter-spacing:0.5px;">D. KAPAN DITEMUKAN?</h2>
      <p style="margin:0 0 16px;font-size:13px;color:#333;line-height:1.5;">
        Konten/situs ini ditemukan dan diverifikasi pada:<br>
        <strong>${new Date(payload.discoveredAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</strong>
      </p>

      <!-- MENGAPA (Why) — Dasar Hukum / Konteks -->
      <h2 style="margin:0 0 6px;font-size:13px;color:#1a237e;text-transform:uppercase;letter-spacing:0.5px;">E. MENGAPA HARUS DIBLOKIR?</h2>
      <p style="margin:0 0 6px;font-size:13px;color:#333;line-height:1.5;">
        Konten/situs tersebut melanggar ketentuan sebagai berikut:
      </p>
      <ol style="margin:0 0 16px;padding-left:20px;font-size:13px;color:#333;line-height:1.6;">
        <li>Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (UU ITE) beserta perubahannya;</li>
        <li>Peraturan Menteri Kominfo Nomor 19 Tahun 2014 tentang Penanganan Situs Internet Bermuatan Negatif;</li>
        ${payload.threatType === 'JUDI_ONLINE' ? '<li>Undang-Undang Nomor 7 Tahun 1974 tentang Penertiban Perjudian;</li>' : ''}
        ${payload.threatType === 'PHISHING' || payload.threatType === 'PHISHING_BANK_LOKAL' ? '<li>Undang-Undang Nomor 8 Tahun 1999 tentang Perlindungan Konsumen;</li>' : ''}
        <li>Dapat menimbulkan kerugian bagi konsumen, masyarakat, dan/atau pelaku usaha.</li>
      </ol>
      <p style="margin:0 0 16px;font-size:13px;color:#555;line-height:1.5;font-style:italic;">
        ${payload.description}
      </p>

      <!-- BAGAIMANA (How) — Bukti Pendukung -->
      <h2 style="margin:0 0 6px;font-size:13px;color:#1a237e;text-transform:uppercase;letter-spacing:0.5px;">F. BUKTI PENDUKUNG</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e0e0e0;border-collapse:collapse;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th width="30" style="padding:6px 8px;font-size:11px;color:#555;text-align:left;border-bottom:1px solid #e0e0e0;">No</th>
            <th style="padding:6px 8px;font-size:11px;color:#555;text-align:left;border-bottom:1px solid #e0e0e0;">URL / File</th>
          </tr>
        </thead>
        <tbody>
          ${evidenceList}
        </tbody>
      </table>
    </td>
  </tr>

  <!-- PERMOHONAN -->
  <tr>
    <td style="padding:0 30px 24px;">
      <h2 style="margin:0 0 6px;font-size:13px;color:#1a237e;text-transform:uppercase;letter-spacing:0.5px;">PERMOHONAN</h2>
      <p style="margin:0 0 4px;font-size:13px;color:#333;line-height:1.6;">
        Bersama ini kami memohon kepada Tim Aduan Konten / Trust+ Positif Kominfo untuk:
      </p>
      <ol style="margin:0 0 16px;padding-left:20px;font-size:13px;color:#333;line-height:1.6;">
        <li>Melakukan pemeriksaan dan verifikasi terhadap konten/situs yang dilaporkan;</li>
        <li>Melakukan pemblokiran terhadap situs/URL tersebut melalui sistem Trust+ Positif Kominfo;</li>
        <li>Memberikan tanda terima laporan dan nomor referensi untuk keperluan tracking.</li>
      </ol>
      <p style="margin:0 0 4px;font-size:13px;color:#333;line-height:1.5;">
        Demikian laporan ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.
      </p>
    </td>
  </tr>

  <!-- TTD -->
  <tr>
    <td style="padding:20px 30px;background:#fafafa;border-top:1px solid #e0e0e0;border-radius:0 0 4px 4px;">
      <p style="margin:0;font-size:12px;color:#333;line-height:1.6;">
        Hormat kami,<br><br>
        <strong>${payload.reporterName}</strong><br>
        ${payload.reporterEmail}<br>
        CyberFrost Security Platform — Automated Brand Protection<br>
        Referensi: ${refId}
      </p>
      <hr style="margin:16px 0;border:none;border-top:1px solid #e0e0e0;">
      <p style="margin:0;font-size:10px;color:#999;line-height:1.4;">
        Laporan ini dibuat secara otomatis oleh sistem SOAR CyberFrost.<br>
        Mohon tidak membalas email ini. Untuk pertanyaan lebih lanjut, hubungi pelapor di email di atas.<br>
        ${refId} • ${payload.date}
      </p>
    </td>
  </tr>

</table>

</body>
</html>`;
}

// ─── 3. Validasi Ukuran Lampiran (maks 5MB) ────────────────────────────────

/**
 * Validasi total ukuran file lampiran tidak melebihi 5MB.
 * - Jika ada file > 5MB, return error
 * - Jika total kumulatif > 5MB, return error
 *
 * Untuk production: download file dari URL dan cek Content-Length.
 * Untuk development/simulasi: gunakan ukuran dummy.
 */
export async function validateAttachmentSizes(
  evidenceUrls: string[],
): Promise<{ valid: boolean; totalBytes: number; files: AttachmentInfo[]; oversized: boolean; error?: string }> {
  if (!evidenceUrls.length) {
    return { valid: true, totalBytes: 0, files: [], oversized: false };
  }

  const files: AttachmentInfo[] = [];
  let totalBytes = 0;

  for (const url of evidenceUrls) {
    try {
      // ── SSRF Guard: blokir akses internal network ──
      const ssrfCheck = validateUrlAgainstSSRF(url);
      if (!ssrfCheck.valid) {
        console.warn(`[Kominfo] SSRF blocked evidence URL: ${url} — ${ssrfCheck.reason}`);
        continue;
      }

      // HEAD request — timeout 8s via AbortSignal.timeout
      const headRes = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(8000),
      });

      const contentLength = parseInt(headRes.headers.get('Content-Length') || '0', 10);
      const contentType = headRes.headers.get('Content-Type') || 'application/octet-stream';
      const filename = url.split('/').pop() || `attachment-${Date.now()}`;

      const size = isNaN(contentLength) ? 0 : contentLength;

      if (size > MAX_ATTACHMENT_BYTES) {
        return {
          valid: false,
          totalBytes: size,
          files: [],
          oversized: true,
          error: `File ${filename} (${(size / 1024 / 1024).toFixed(2)}MB) melebihi batas maksimal 5MB.`,
        };
      }

      totalBytes += size;
      if (totalBytes > MAX_ATTACHMENT_BYTES) {
        return {
          valid: false,
          totalBytes,
          files: [],
          oversized: true,
          error: `Total ukuran lampiran (${(totalBytes / 1024 / 1024).toFixed(2)}MB) melebihi batas maksimal 5MB.`,
        };
      }

      files.push({ filename, content: Buffer.alloc(0), contentType, size });
    } catch (err: any) {
      // Jika HEAD gagal, skip file ini (tidak critical path)
      console.warn(`[Kominfo] Warning: Cannot validate attachment size for ${url}: ${err.message}`);
      // Lanjutkan tanpa file ini
    }
  }

  return { valid: true, totalBytes, files, oversized: false };
}

// ─── 4. Dispatch Utama ──────────────────────────────────────────────────────

/**
 * Kirim laporan ke Kominfo via Nodemailer dengan:
 *  - Subject format [LAPORAN {threat}] {entity} - Segera Tindak Lanjut
 *  - Body HTML 5W1H
 *  - Validasi lampiran maks 5MB
 *
 * @returns KominfoDispatchResult — hasil pengiriman lengkap dengan metadata
 */
export async function dispatchToKominfo(
  payload: KominfoDispatchPayload,
): Promise<KominfoDispatchResult> {
  const refId = generateRefId();
  const subject = generateKominfoSubject(payload.threatType, payload.impersonatedEntity);
  const bodyHtml = generateKominfoBodyHtml(payload, refId);

  // Validasi lampiran
  const attachmentCheck = await validateAttachmentSizes(payload.evidenceUrls || []);

  // Jika oversized, tolak pengiriman
  if (!attachmentCheck.valid) {
    return {
      success: false,
      subject,
      refId,
      attachmentCount: 0,
      attachmentTotalBytes: attachmentCheck.totalBytes,
      attachmentOversized: true,
      error: attachmentCheck.error || 'Attachment exceeds 5MB limit.',
    };
  }

  // Kirim email — body sebagai plain text fallback, html untuk rendering kaya
  const result = await dispatchLegalEmail({
    to: KOMINFO_EMAIL,
    subject,
    body: bodyHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    html: bodyHtml,
    attachmentUrls: payload.evidenceUrls,
  });

  if (!result.success) {
    return {
      success: false,
      subject,
      refId,
      messageId: result.messageId,
      attachmentCount: attachmentCheck.files.length,
      attachmentTotalBytes: attachmentCheck.totalBytes,
      attachmentOversized: false,
      error: result.error || 'Failed to dispatch email to Kominfo.',
    };
  }

  return {
    success: true,
    subject,
    refId,
    messageId: result.messageId,
    attachmentCount: attachmentCheck.files.length,
    attachmentTotalBytes: attachmentCheck.totalBytes,
    attachmentOversized: false,
  };
}
