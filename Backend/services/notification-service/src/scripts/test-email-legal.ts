/**
 * Legal Email Test — Simulasi Notifikasi Keamanan Siber
 * ======================================================
 * Menguji pengiriman email menggunakan template asli CyberFrost
 * untuk kasus notifikasi security/legal.
 *
 * Jalankan:
 *   cd Backend/services/notification-service
 *   npx tsx src/scripts/test-email-legal.ts
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// ── Load env ──
dotenv.config({ path: '../../.env' });

// ── Konfigurasi SMTP (prioritas: env → fallback) ──
const CFG = {
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  user: process.env.SMTP_USER || 'resend',
  pass: process.env.SMTP_PASS || 're_GLsNW9L6_FvngojVcZufx3cs7YDWETcU7',
  fromEmail: process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev',
  toEmail: 'danielstputra@gmail.com',
};

// ── Template Email ──

function criticalAlertHTML(title: string, message: string, detailsUrl: string, timestamp: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:24px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px;">🚨 CRITICAL ALERT</h1>
              <p style="color:#fca5a5;margin:8px 0 0;font-size:13px;">CyberFrost Security Platform</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr><td style="padding:32px;">
            <h2 style="color:#dc2626;margin:0 0 12px;font-size:20px;">${title}</h2>
            <p style="color:#333;font-size:14px;line-height:1.6;">${message}</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin:20px 0;">
              <tr><td style="padding:16px;">
                <p style="margin:0 0 8px;color:#991b1b;font-size:13px;font-weight:bold;">📋 Laporan Detail:</p>
                <table style="font-size:13px;color:#333;width:100%;">
                  <tr><td style="padding:4px 0;color:#666;width:100px;">Severity</td><td style="padding:4px 0;"><span style="background:#dc2626;color:#fff;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:bold;">CRITICAL</span></td></tr>
                  <tr><td style="padding:4px 0;color:#666;">Timestamp</td><td style="padding:4px 0;">${timestamp}</td></tr>
                  <tr><td style="padding:4px 0;color:#666;">Source</td><td style="padding:4px 0;">CyberFrost Intelligence Engine</td></tr>
                </table>
              </td></tr>
            </table>

            <p style="color:#dc2626;font-size:13px;font-weight:bold;margin:16px 0;">⚠️ Tindakan required: Segera review dan lakukan mitigasi.</p>

            <a href="${detailsUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;">🔍 Review Alert</a>
          </td></tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                CyberFrost Platform • Automated Security Alert<br>
                This is an automated notification from your security monitoring system.
              </p>
            </td>
          </tr>

        </table>
      </td></tr></table>
    </body>
    </html>
  `;
}

function highAlertHTML(title: string, message: string, detailsUrl: string, severity: string, timestamp: string): string {
  const sevColor = severity === 'HIGH' ? '#ea580c' : '#ca8a04';
  const sevBg = severity === 'HIGH' ? '#fff7ed' : '#fefce8';
  const sevBorder = severity === 'HIGH' ? '#fed7aa' : '#fef08a';
  const emoji = severity === 'HIGH' ? '⚠️' : 'ℹ️';

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,${sevColor},#92400e);padding:24px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px;">${emoji} ${severity} ALERT</h1>
              <p style="color:#fde68a;margin:8px 0 0;font-size:13px;">CyberFrost Security Platform</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr><td style="padding:32px;">
            <h2 style="color:${sevColor};margin:0 0 12px;font-size:20px;">${title}</h2>
            <p style="color:#333;font-size:14px;line-height:1.6;">${message}</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:${sevBg};border:1px solid ${sevBorder};border-radius:8px;margin:20px 0;">
              <tr><td style="padding:16px;">
                <p style="margin:0 0 8px;color:${sevColor};font-size:13px;font-weight:bold;">📋 Laporan Detail:</p>
                <table style="font-size:13px;color:#333;width:100%;">
                  <tr><td style="padding:4px 0;color:#666;width:100px;">Severity</td><td style="padding:4px 0;"><span style="background:${sevColor};color:#fff;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:bold;">${severity}</span></td></tr>
                  <tr><td style="padding:4px 0;color:#666;">Timestamp</td><td style="padding:4px 0;">${timestamp}</td></tr>
                  <tr><td style="padding:4px 0;color:#666;">Source</td><td style="padding:4px 0;">CyberFrost Intelligence Engine</td></tr>
                </table>
              </td></tr>
            </table>

            <a href="${detailsUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;">🔍 View Details</a>
          </td></tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                CyberFrost Platform • Automated Security Alert<br>
                This is an automated notification from your security monitoring system.
              </p>
            </td>
          </tr>

        </table>
      </td></tr></table>
    </body>
    </html>
  `;
}

// ── Skenario Legal Test ──

interface TestScenario {
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  message: string;
  detailsUrl: string;
}

const SCENARIOS: TestScenario[] = [
  {
    name: '🚨  Data Breach Detection',
    severity: 'CRITICAL',
    title: 'Potential Data Breach — Unauthorized Database Access Detected',
    message: `Our intrusion detection system has identified unusual database access patterns originating from an unrecognized IP address (203.0.113.45). Multiple SELECT queries targeting the users table with sensitive PII fields were detected within a 2-minute window. This matches the behavioral signature of a data exfiltration attempt. Immediate investigation is required.`,
    detailsUrl: 'https://cyberfrost.vercel.app/alerts/incident-001',
  },
  {
    name: '⚠️  Ransomware Indicator',
    severity: 'CRITICAL',
    title: 'Ransomware Activity — File Encryption Detected on Production Server',
    message: `File integrity monitoring has detected mass file rename operations with a .locked extension on production server web-03. The pattern matches known ransomware strains (LockBit 3.0 variant). Approximately 2,347 files have been affected in the last 5 minutes. Critical services: api-gateway, auth-service are potentially compromised.`,
    detailsUrl: 'https://cyberfrost.vercel.app/alerts/incident-002',
  },
  {
    name: '🔓  Unauthorized Access Attempt',
    severity: 'HIGH',
    title: 'Brute Force Attack — Multiple Failed Admin Login Attempts',
    message: `SSH monitoring has recorded 1,547 failed authentication attempts on the admin panel (admin.cyberfrost.vercel.app) within the last 15 minutes. Attack sources: distributed across 23 different IP addresses, indicating a coordinated credential stuffing attack. Admin accounts affected: root, admin, sysadmin, backup.`,
    detailsUrl: 'https://cyberfrost.vercel.app/alerts/incident-003',
  },
  {
    name: '🕵️  Suspicious Outbound Traffic',
    severity: 'HIGH',
    title: 'Data Exfiltration Warning — Unusual Outbound Data Transfer',
    message: `Network traffic analysis indicates 1.2GB of outbound data transfer to an unknown external IP (198.51.100.77) over the past hour. The destination is not on the approved allowlist. Data transfer occurred outside normal business hours (03:00-04:00 WIB) and used an unusual port (8443). Possible data exfiltration in progress.`,
    detailsUrl: 'https://cyberfrost.vercel.app/alerts/incident-004',
  },
  {
    name: '🔐  Compliance Violation',
    severity: 'MEDIUM',
    title: 'GDPR Compliance Alert — Unencrypted PII Data Storage Detected',
    message: `Weekly compliance scan has identified 15 database tables containing personally identifiable information (PII) that lack proper encryption at rest. This violates GDPR Article 32 (Security of Processing) and potentially ISO 27001 controls. Affected data includes: email addresses, phone numbers, and government ID numbers from the user_profiles collection.`,
    detailsUrl: 'https://cyberfrost.vercel.app/alerts/compliance-001',
  },
  {
    name: '🌐  DNS Hijacking Suspicion',
    severity: 'HIGH',
    title: 'DNS Configuration Anomaly — Possible Domain Hijacking',
    message: `DNS resolution for cyberfrost.vercel.app has returned inconsistent results across 3 different DNS providers. The domain's NS records have been modified without authorization 2 hours ago. New nameservers point to an unfamiliar hosting provider in Eastern Europe. DNS traffic is being redirected to a suspicious IP: 185.220.101.45.`,
    detailsUrl: 'https://cyberfrost.vercel.app/alerts/incident-005',
  },
];

// ── Main ──

async function main() {
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'long' });

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     📋 LEGAL EMAIL TEST — CYBERFROST SECURITY PLATFORM     ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  SMTP:    ${CFG.host}:${CFG.port}`);
  console.log(`║  From:    ${CFG.fromEmail}`);
  console.log(`║  To:      ${CFG.toEmail}`);
  console.log(`║  Date:    ${timestamp}`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  const transport = nodemailer.createTransport({
    host: CFG.host,
    port: CFG.port,
    secure: CFG.port === 465,
    auth: { user: CFG.user, pass: CFG.pass },
    tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  // ── Verify dulu ──
  process.stdout.write('⏳ Verifying SMTP connection... ');
  try {
    await transport.verify();
    console.log('✅ OK');
  } catch (e: any) {
    console.log(`❌ ${e.message}`);
    process.exit(1);
  }

  // ── Kirim semua skenario ──
  let success = 0;
  let failed = 0;

  console.log('');
  console.log(`📨 Mengirim ${SCENARIOS.length} email test...`);
  console.log('');

  for (const scenario of SCENARIOS) {
    process.stdout.write(`  ${scenario.name}... `);

    try {
      const isCritical = scenario.severity === 'CRITICAL';
      const html = isCritical
        ? criticalAlertHTML(scenario.title, scenario.message, scenario.detailsUrl, timestamp)
        : highAlertHTML(scenario.title, scenario.message, scenario.detailsUrl, scenario.severity, timestamp);

      const subject = isCritical
        ? `🚨 [CRITICAL] ${scenario.title}`
        : `[${scenario.severity}] ${scenario.title}`;

      await transport.sendMail({
        from: `"CyberFrost Security" <${CFG.fromEmail}>`,
        to: CFG.toEmail,
        subject,
        html,
      });

      console.log('✅ TERKIRIM');
      success++;
    } catch (e: any) {
      console.log(`❌ ${e.message.slice(0, 80)}`);
      failed++;
    }
  }

  // ── Summary ──
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  📊 HASIL TEST EMAIL LEGAL                  ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  ✅ Berhasil:  ${success}/${SCENARIOS.length}`);
  console.log(`║  ❌ Gagal:     ${failed}/${SCENARIOS.length}`);
  console.log(`║  📬 Cek inbox: ${CFG.toEmail}`);
  if (success > 0) {
    console.log('╠══════════════════════════════════════════════╣');
    console.log('║  🎉 SMTP RESEND SIAP DIGUNAKAN!            ║');
  }
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // ── Kirim 1 email ringkasan ──
  if (success > 0) {
    process.stdout.write('⏳ Mengirim email ringkasan... ');
    try {
      await transport.sendMail({
        from: `"CyberFrost Security" <${CFG.fromEmail}>`,
        to: CFG.toEmail,
        subject: `✅ [TEST COMPLETE] ${success} Email Legal Terkirim — ${timestamp}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:#059669;color:#fff;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
              <h1 style="margin:0;">✅ Email Legal Test Complete</h1>
            </div>
            <div style="border:1px solid #e5e7eb;padding:20px;border-radius:0 0 8px 8px;">
              <p style="font-size:16px;color:#333;">Halo,</p>
              <p style="font-size:14px;color:#555;">
                Seluruh <strong>${SCENARIOS.length}</strong> email test legal notifikasi keamanan siber
                telah berhasil dikirim menggunakan SMTP <strong>Resend</strong>.
              </p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr style="background:#f0fdf4;">
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;color:#059669;font-weight:bold;">✅ Berhasil</td>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;">${success} email</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;color:#dc2626;">❌ Gagal</td>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;">${failed} email</td>
                </tr>
                <tr style="background:#f8fafc;">
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;">Waktu Test</td>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;">${timestamp}</td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
              <p style="font-size:12px;color:#999;text-align:center;">
                CyberFrost Platform • Automated Security Alert System<br>
                SMTP Provider: Resend • Test Timestamp: ${timestamp}
              </p>
            </div>
          </div>
        `,
      });
      console.log('✅ TERKIRIM');
    } catch (e: any) {
      console.log(`❌ ${e.message.slice(0, 60)}`);
    }
  }

  console.log('');
  console.log('📬  Cek semua email di inbox:', CFG.toEmail);
  console.log('');
}

main();
