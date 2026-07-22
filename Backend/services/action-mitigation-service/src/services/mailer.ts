import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  /** HTML version of body (if omitted, body is sent as plain text) */
  html?: string;
  attachmentUrls?: string[];
}

// ── Singleton transporter ──
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST || 'smtp.resend.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || host.includes('resend'),
    auth: {
      user: process.env.SMTP_USER || 'resend',
      pass: process.env.SMTP_PASS || '',
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true,
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return _transporter;
}

export async function dispatchLegalEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"CyberFrost Security" <${process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: options.to,
      cc: options.cc,
      subject: options.subject,
      text: options.body,
      html: options.html || undefined,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('[Mailer] Dispatch error:', err.message);
    return { success: false, error: err.message };
  }
}
