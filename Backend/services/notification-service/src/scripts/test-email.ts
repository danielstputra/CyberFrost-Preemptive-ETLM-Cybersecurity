/**
 * Test Email — Verifikasi Konfigurasi SMTP Resend
 * ================================================
 * Cara pakai:
 *   1. Langsung jalanin (pake konfigurasi dari file ini):
 *      npx tsx src/scripts/test-email.ts
 *
 *   2. Atau pake environment variable (.env):
 *      npx tsx src/scripts/test-email.ts --env
 */

import nodemailer from 'nodemailer';

// ── Config langsung (ganti sesuai data Resend Anda) ──
const SMTP_CONFIG = {
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  user: 'resend',
  pass: 're_GLsNW9L6_FvngojVcZufx3cs7YDWETcU7',
  fromEmail: 'onboarding@resend.dev', // Ganti setelah verified domain
  toEmail: 'danielstputra@gmail.com',
};

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  📧 TEST SMTP — RESEND                      ║');
  console.log('╠══════════════════════════════════════════════╣');

  if (process.argv.includes('--env')) {
    // Load dari environment
    const dotenv = await import('dotenv');
    dotenv.config({ path: '../../.env' });
    SMTP_CONFIG.host = process.env.SMTP_HOST || SMTP_CONFIG.host;
    SMTP_CONFIG.port = parseInt(process.env.SMTP_PORT || '465', 10);
    SMTP_CONFIG.user = process.env.SMTP_USER || SMTP_CONFIG.user;
    SMTP_CONFIG.pass = process.env.SMTP_PASS || SMTP_CONFIG.pass;
    SMTP_CONFIG.fromEmail = process.env.SMTP_FROM_EMAIL || SMTP_CONFIG.fromEmail;
    console.log('║  Mode: Environment                            ║');
  } else {
    console.log('║  Mode: Manual (dari file)                     ║');
  }

  console.log(`║  Host:     ${SMTP_CONFIG.host.padEnd(33)}║`);
  console.log(`║  Port:     ${String(SMTP_CONFIG.port).padEnd(33)}║`);
  console.log(`║  From:     ${SMTP_CONFIG.fromEmail.padEnd(33)}║`);
  console.log(`║  To:       ${SMTP_CONFIG.toEmail.padEnd(33)}║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  ⏳ Connecting...                            ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  const transport = nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: { user: SMTP_CONFIG.user, pass: SMTP_CONFIG.pass },
    tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  try {
    console.log('⏳ Verifying SMTP connection...');
    await transport.verify();
    console.log('✅  SMTP Connection: OK');

    console.log('⏳ Sending test email...');
    const info = await transport.sendMail({
      from: `"CyberFrost Test" <${SMTP_CONFIG.fromEmail}>`,
      to: SMTP_CONFIG.toEmail,
      subject: '🧪 Test Email — SMTP Resend Berhasil!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #000; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0;">✅ SMTP Resend Berhasil!</h1>
          </div>
          <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333;">Halo 👋,</p>
            <p style="font-size: 14px; color: #555;">
              Email ini menandakan bahwa konfigurasi SMTP <strong>Resend</strong> sudah berfungsi dengan baik.
              Tidak ada lagi timeout seperti MailerSend sebelumnya! 🎉
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <h3 style="color: #000;">📋 Detail Koneksi:</h3>
            <table style="font-size: 13px; color: #333; width: 100%;">
              <tr><td style="padding: 4px 8px; background: #f9fafb;">SMTP Host</td><td style="padding: 4px 8px;">${SMTP_CONFIG.host}</td></tr>
              <tr><td style="padding: 4px 8px; background: #f9fafb;">Port</td><td style="padding: 4px 8px;">${SMTP_CONFIG.port}</td></tr>
              <tr><td style="padding: 4px 8px; background: #f9fafb;">Waktu</td><td style="padding: 4px 8px;">${new Date().toLocaleString('id-ID')}</td></tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              CyberFrost Platform — Automated Security Alert
            </p>
          </div>
        </div>
      `,
    });

    console.log(`✅  Email terkirim! Message ID: ${info.messageId}`);
    console.log(`📬  Cek inbox: ${SMTP_CONFIG.toEmail}`);
    console.log('');
    console.log('🎉  SMTP Resend berfungsi dengan baik!');
    console.log('');
  } catch (err: any) {
    console.error('❌  GAGAL:', err.message);
    if (err.message.includes('ETIMEOUT')) {
      console.error('   🔍 Coba periksa koneksi internet atau firewall');
    } else if (err.message.includes('auth')) {
      console.error('   🔍 API Key Resend mungkin salah');
    } else if (err.message.includes('sender')) {
      console.error('   🔍 Sender email belum diverifikasi di Resend Dashboard');
    }
    process.exit(1);
  }
}

main();
