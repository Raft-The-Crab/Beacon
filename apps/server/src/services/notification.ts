import nodemailer from 'nodemailer';
import { logger } from './logger';
import dns from 'dns';

// Force IPv4 first for all connections in this process to avoid ENETUNREACH on IPv6-only/misconfigured hosts
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000; // ms

const BRAND_COLOR = '#5865F2';
const BRAND_NAME = 'Beacon';

/** Reusable HTML email wrapper */
function emailLayout(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta name="x-apple-disable-message-reformatting">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        @media only screen and (max-width: 600px) {
          .email-container { width: 100% !important; border-radius: 0 !important; }
          .email-body { padding: 32px 24px !important; }
          .email-header { padding: 40px 24px !important; }
          .email-footer { padding: 32px 24px !important; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background-color:#f3f4f6;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
        <tr><td align="center">
          <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid #e5e7eb;">
            <tr><td class="email-header" style="background:linear-gradient(135deg, ${BRAND_COLOR}, #4a54e1);padding:48px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">${BRAND_NAME}</h1>
            </td></tr>
            <tr><td class="email-body" style="padding:48px 40px;">
              <h2 style="margin:0 0 24px;color:#111827;font-size:22px;font-weight:600;letter-spacing:-0.3px;">${title}</h2>
              ${body}
            </td></tr>
            <tr><td class="email-footer" style="padding:32px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.<br>
                <span style="font-size:12px;color:#9ca3af;margin-top:8px;display:block;">This is an automated message, please do not reply.</span>
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

export class NotificationService {
  private static createTransporter(port: number) {
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').replace(/\s+/g, '');

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // SSL for 465, STARTTLS for others
      auth: { user, pass },
      pool: true,
      maxConnections: 3,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        // Do not fail on invalid certs in dev/testing, but keep it strict in prod if possible
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  private static transporter = NotificationService.createTransporter(
    parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10)
  );

  private static _verified = false;

  private static getFromAddress(aliasType: 'support' | 'noreply' = 'noreply') {
    const supportLabel = process.env.EMAIL_FROM_NAME || 'Beacon Support';
    const noreplyLabel = process.env.EMAIL_NOREPLY_NAME || 'Beacon Platform';

    if (aliasType === 'support') {
      const addr = process.env.EMAIL_SUPPORT_ADDRESS || 'support@beacon.qzz.io';
      return `"${supportLabel}" <${addr}>`;
    } else {
      const addr = process.env.EMAIL_NOREPLY_ADDRESS || 'noreply@beacon.qzz.io';
      return `"${noreplyLabel}" <${addr}>`;
    }
  }

  /** Verify SMTP connection with automatic port failover and detailed diagnostics */
  static async ensureConnection() {
    if (this._verified) return;

    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
    const initialPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10);
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').replace(/\s+/g, '');

    if (!user || !pass) {
      logger.warn(`[EMAIL] Missing credentials for ${host}:${initialPort}. Running in DRY-RUN mode.`);
      return;
    }

    const tryConnect = async (port: number): Promise<boolean> => {
      try {
        logger.info(`[EMAIL] Testing SMTP: ${user}@${host}:${port} (SSL: ${port === 465})...`);
        const testTransporter = NotificationService.createTransporter(port);
        await testTransporter.verify();

        // Success! Bind this transporter
        this.transporter = testTransporter;
        this._verified = true;
        logger.success(`[EMAIL] SMTP verified: ${host}:${port}`);
        return true;
      } catch (err: any) {
        let hint = '';
        if (err.responseCode === 535) {
          hint = ' -> ERROR: Invalid credentials. IF USING GMAIL, YOU MUST USE AN APP PASSWORD.';
        } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
          hint = ` -> ERROR: Port ${port} is blocked or unreachable.`;
        }

        logger.error(`[EMAIL] Failed at ${host}:${port}: ${err.message}${hint}`);
        return false;
      }
    };

    if (await tryConnect(initialPort)) return;

    // Fallback logic
    const fallbackPort = initialPort === 465 ? 587 : 465;
    logger.warn(`[EMAIL] Initial port ${initialPort} failed. Trying fallback port ${fallbackPort}...`);
    await tryConnect(fallbackPort);
  }

  private static async sendWithRetry(mailOptions: nodemailer.SendMailOptions, dryRunMeta?: Record<string, string>): Promise<boolean> {
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

    if (!user || !pass) {
      const metaLines = dryRunMeta
        ? Object.entries(dryRunMeta).map(([k, v]) => `  ${k}: ${v}`).join('\n')
        : '';
      logger.warn(
        `\n╔══════════════════════ EMAIL DRY-RUN ══════════════════════╗` +
        `\n  To:      ${mailOptions.to}` +
        `\n  Subject: ${mailOptions.subject}` +
        (metaLines ? `\n${metaLines}` : '') +
        `\n╚══════════════════════════════════════════════════════════╝`
      );
      return true;
    }

    await this.ensureConnection();

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.transporter.sendMail(mailOptions);
        logger.info(`[EMAIL] Sent "${mailOptions.subject}" to ${mailOptions.to}`);
        return true;
      } catch (error: any) {
        const isRetryable = error.responseCode >= 400 || error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT';
        if (attempt < MAX_RETRIES && isRetryable) {
          const delay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1);
          logger.warn(`[EMAIL] Attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${delay}ms: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          logger.error(`[EMAIL] Failed after ${attempt} attempts to send "${mailOptions.subject}" to ${mailOptions.to}: ${error.message}`);
          return false;
        }
      }
    }
    return false;
  }

  static async sendVerificationCode(email: string, code: string) {
    return this.sendWithRetry({
      from: this.getFromAddress('noreply'),
      to: email,
      subject: 'Verify Your Beacon Account',
      html: emailLayout('Verify Your Email', `
        <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 32px;">
          Welcome to Beacon! To complete your registration and secure your account, please use the verification code below.
        </p>
        <div style="background-color:#f3f4f6;border:1px solid #e5e7eb;border-radius:12px;padding:32px;text-align:center;margin:0 0 32px;">
          <span style="font-family:'Courier New',Courier,monospace;font-size:42px;font-weight:700;letter-spacing:12px;color:#111827;display:inline-block;margin-left:12px;">
            ${code}
          </span>
        </div>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">
          This code expires in <strong>24 hours</strong>. If you didn't attempt to create a Beacon account, you can safely ignore and delete this email.
        </p>
      `),
    }, { 'Verification Code': code });
  }

  static async sendPasswordReset(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password?token=${token}`;

    return this.sendWithRetry({
      from: this.getFromAddress('noreply'),
      to: email,
      subject: 'Reset Your Beacon Password',
      html: emailLayout('Reset Your Password', `
        <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 32px;">
          We received a request to reset the password for your Beacon account. Click the button below to choose a new password.
        </p>
        <div style="text-align:center;margin:0 0 32px;">
          <a href="${resetUrl}" style="display:inline-block;padding:16px 36px;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:16px;transition:background-color 0.2s;">
            Reset Password
          </a>
        </div>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 8px;">
          This link expires in <strong>1 hour</strong>. If the button doesn't work, copy and paste this URL into your browser:
        </p>
        <p style="color:#6b7280;font-size:13px;word-break:break-all;margin:0;background-color:#f3f4f6;padding:12px;border-radius:6px;border:1px solid #e5e7eb;">
          ${resetUrl}
        </p>
      `),
    }, { 'Reset Token': token, 'Reset URL': resetUrl });
  }

  static async sendWelcomeEmail(email: string, username: string) {
    return this.sendWithRetry({
      from: this.getFromAddress('noreply'),
      to: email,
      subject: 'Welcome to Beacon!',
      html: emailLayout(`Welcome, ${username}!`, `
        <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Your account is verified and ready to go.
        </p>
        <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">
          Here are a few things you can do to get started:
        </p>
        <ul style="color:#4b5563;font-size:15px;line-height:1.8;padding-left:24px;margin:0 0 32px;">
          <li><strong>Create or join a server</strong> to start chatting</li>
          <li><strong>Customize your profile</strong> with an avatar and bio</li>
          <li><strong>Invite friends</strong> to your space</li>
        </ul>
        <div style="text-align:center;">
          <a href="${process.env.FRONTEND_URL || 'https://beacon.qzz.io'}" style="display:inline-block;padding:16px 36px;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:16px;">
            Open Beacon
          </a>
        </div>
      `),
    });
  }

  static async sendSecurityAlert(email: string, reason: string) {
    return this.sendWithRetry({
      from: this.getFromAddress('support'),
      to: email,
      subject: 'Beacon Security Alert',
      html: emailLayout('Security Alert', `
        <div style="background-color:#fef2f2;border:1px solid #f87171;border-radius:10px;padding:20px;margin:0 0 32px;">
          <p style="color:#991b1b;font-size:15px;line-height:1.6;margin:0;font-weight:500;">
            <span style="font-size:18px;margin-right:8px;">⚠️</span> ${reason}
          </p>
        </div>
        <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">
          If this was you, no further action is needed. If you do not recognize this activity, please secure your account immediately by changing your password.
        </p>
        <div style="text-align:center;">
          <a href="${process.env.FRONTEND_URL || 'https://beacon.qzz.io'}/settings/security" style="display:inline-block;padding:16px 36px;background-color:#ef4444;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:16px;">
            Review Security Settings
          </a>
        </div>
      `),
    });
  }

  static async sendBackupNotice(email: string) {
    return this.sendWithRetry({
      from: this.getFromAddress('noreply'),
      to: email,
      subject: 'Your Beacon Server Backup is Ready',
      html: emailLayout('Backup Complete', `
        <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Your server backup has been generated successfully and is ready for download.
        </p>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">
          You can access your backup file directly from your server settings. Please note that backups are retained for 7 days.
        </p>
      `),
    });
  }

  static async sendSystemUpdateNotice(email: string, version: string, releaseNotes: string) {
    return this.sendWithRetry({
      from: this.getFromAddress('noreply'),
      to: email,
      subject: `Beacon ${version} Update`,
      html: emailLayout(`What's new in Beacon ${version}`, `
        <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">
          We've just released a major update to Beacon. Here is a quick look at what's changed:
        </p>
        <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin:0 0 32px;color:#4b5563;font-size:15px;line-height:1.6;">
          ${releaseNotes}
        </div>
        <div style="text-align:center;">
          <a href="${process.env.FRONTEND_URL || 'https://beacon.qzz.io'}/updates" style="display:inline-block;padding:16px 36px;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:16px;">
            Read Full Patch Notes
          </a>
        </div>
      `),
    });
  }
}