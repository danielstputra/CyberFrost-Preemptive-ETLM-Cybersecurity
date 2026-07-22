/**
 * Mailer Service — Email Notification
 * ======================================
 * In development: logs emails to console.
 * In production: sends via Nodemailer (SMTP).
 */

import nodemailer from 'nodemailer';
import { config } from '../config';

// For production: create a real transporter
function createTransporter() {
  if (config.nodeEnv === 'production' && config.smtp.user && config.smtp.pass) {
    return nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465 || config.smtp.host.includes('resend'),
      auth: { user: config.smtp.user, pass: config.smtp.pass },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
      connectionTimeout: 10000,  // timeout koneksi 10 detik
      greetingTimeout: 10000,    // timeout greeting SMTP 10 detik
      socketTimeout: 15000,      // timeout socket 15 detik
    });
  }
  return null;
}

const transporter = createTransporter();

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Send an email. In dev mode, logs to console instead.
 * Returns true if the email was "sent" (or logged).
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const recipients = Array.isArray(payload.to) ? payload.to.join(', ') : payload.to;

  if (!transporter) {
    // ── Dev mode: simulate ──
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  📧 EMAIL NOTIFICATION (simulated)          ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  To:      ${recipients.padEnd(36)}║`);
    console.log(`║  Subject: ${payload.subject.padEnd(36)}║`);
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  ${payload.html.replace(/\n/g, '\n║  ').substring(0, 500)}`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
    return true;
  }

  // ── Production: actually send ──
  try {
    await transporter.sendMail({
      from: config.smtp.fromEmail,
      to: recipients,
      subject: payload.subject,
      html: payload.html,
    });
    console.log(`[Mailer] Email sent to ${recipients}: ${payload.subject}`);
    return true;
  } catch (err) {
    console.error('[Mailer] Failed to send email:', (err as Error).message);
    return false;
  }
}

// ── Email Template Builders ──

export function buildCriticalAlertEmail(
  title: string,
  message: string,
  detailsUrl: string,
): EmailPayload {
  return {
    to: config.adminEmails,
    subject: `🚨 [CRITICAL] ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h1 style="color: #dc2626;">🚨 Critical Security Alert</h1>
        <h2>${title}</h2>
        <p style="font-size: 14px; color: #333;">${message}</p>
        <hr/>
        <p><strong>Action Required:</strong> Review this alert immediately.</p>
        <a href="${detailsUrl}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 4px;">
          View Details
        </a>
        <hr/>
        <p style="font-size: 12px; color: #666;">CyberFrost Platform • Automated Security Alert</p>
      </div>
    `,
  };
}

export function buildAlertEmail(
  title: string,
  message: string,
  detailsUrl: string,
  severity: string,
): EmailPayload {
  const color = severity === 'HIGH' ? '#ea580c' : '#ca8a04';
  const emoji = severity === 'HIGH' ? '⚠️' : 'ℹ️';
  return {
    to: config.adminEmails,
    subject: `[${severity}] ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h1 style="color: ${color};">${emoji} Security Alert</h1>
        <p><strong>Severity:</strong> ${severity}</p>
        <h2>${title}</h2>
        <p style="font-size: 14px; color: #333;">${message}</p>
        <hr/>
        <a href="${detailsUrl}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 4px;">
          View Details
        </a>
        <hr/>
        <p style="font-size: 12px; color: #666;">CyberFrost Platform • Automated Security Alert</p>
      </div>
    `,
  };
}
