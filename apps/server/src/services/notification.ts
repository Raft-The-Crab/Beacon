import nodemailer from 'nodemailer';
import { logger } from './logger';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000; // ms

const BRAND_COLOR = '#5865F2';
const BRAND_NAME = 'Beacon';

/** Reusable HTML email wrapper */
function emailLayout(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:40px 0">
        <tr><td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
            <tr><td style="background:linear-gradient(135deg,${BRAND_COLOR},#7289DA);padding:32px 40px 24px">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">${BRAND_NAME}</h1>
            </td></tr>
            <tr><td style="padding:32px 40px">
              <h2 style="margin:0 0 16px;color:#2c2f33;font-size:20px;font-weight:600">${title}</h2>
              ${body}
            </td></tr>
            <tr><td style="padding:24px 40px;border-top:1px solid #e8e8e8">
              <p style="margin:0;font-size:12px;color:#99aab5;text-align:center">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME} &mdash; Connecting communities across the cosmos
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
  private static transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE 
      ? process.env.EMAIL_SECURE !== 'false' 
      : (process.env.EMAIL_PORT === '465' || process.env.SMTP_PORT === '465'),
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

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

  /** Verify SMTP connection on first use */
  static async ensureConnection() {
    if (this._verified) return;
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10);
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;

    if (!user || !(process.env.EMAIL_PASS || process.env.SMTP_PASS)) {
      logger.warn(`[EMAIL] No credentials configured for ${host}:${port} — running in dry-run mode`);
      return;
    }

    try {
      logger.info(`[EMAIL] Attempting to verify SMTP at ${host}:${port}...`);
      await this.transporter.verify();
      this._verified = true;
      logger.success(`[EMAIL] SMTP connection verified successfully for ${user} at ${host}`);
    } catch (err: any) {
      logger.error(`[EMAIL] SMTP verification failed for ${host}:${port}: ${err.message}`);
      if (err.code === 'EAUTH') {
        logger.error('[EMAIL] Authentication failed — If using Gmail, make sure to use an APP PASSWORD.');
      }
    }
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
        <p style="color:#4f545c;font-size:15px;line-height:1.6;margin:0 0 24px">
          Welcome to Beacon! Use the verification code below to complete your registration.
        </p>
        <div style="font-size:36px;font-weight:800;letter-spacing:6px;color:${BRAND_COLOR};padding:24px;background:#f8f9fa;border-radius:8px;text-align:center;margin:0 0 24px;font-family:monospace">
          ${code}
        </div>
        <p style="color:#72767d;font-size:13px;line-height:1.5;margin:0">
          This code expires in <strong>24 hours</strong>. If you didn't create a Beacon account, you can safely ignore this email.
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
        <p style="color:#4f545c;font-size:15px;line-height:1.6;margin:0 0 24px">
          We received a request to reset the password for your Beacon account. Click the button below to set a new password.
        </p>
        <div style="text-align:center;margin:0 0 24px">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
            Reset Password
          </a>
        </div>
        <p style="color:#72767d;font-size:13px;line-height:1.5;margin:0 0 8px">
          This link expires in <strong>1 hour</strong>. If the button doesn't work, copy and paste this URL:
        </p>
        <p style="color:#72767d;font-size:12px;word-break:break-all;margin:0">${resetUrl}</p>
      `),
    }, { 'Reset Token': token, 'Reset URL': resetUrl });
  }

  static async sendWelcomeEmail(email: string, username: string) {
    return this.sendWithRetry({
      from: this.getFromAddress('noreply'),
      to: email,
      subject: 'Welcome to Beacon! 🎉',
      html: emailLayout(`Welcome, ${username}!`, `
        <p style="color:#4f545c;font-size:15px;line-height:1.6;margin:0 0 16px">
          Your account has been verified and you're all set to start using Beacon.
        </p>
        <p style="color:#4f545c;font-size:15px;line-height:1.6;margin:0 0 24px">
          Here's what you can do next:
        </p>
        <ul style="color:#4f545c;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 24px">
          <li><strong>Create or join a server</strong> — start your community</li>
          <li><strong>Customize your profile</strong> — avatar, bio, and more</li>
          <li><strong>Invite friends</strong> — grow your space</li>
          <li><strong>Explore bots</strong> — add powerful integrations</li>
        </ul>
        <div style="text-align:center">
          <a href="${process.env.FRONTEND_URL || 'https://beacon.qzz.io'}" style="display:inline-block;padding:14px 32px;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
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
      subject: '⚠️ Beacon Security Alert',
      html: emailLayout('Security Alert', `
        <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin:0 0 24px">
          <p style="color:#856404;font-size:14px;line-height:1.5;margin:0">
            <strong>⚠️ Alert:</strong> ${reason}
          </p>
        </div>
        <p style="color:#4f545c;font-size:15px;line-height:1.6;margin:0 0 16px">
          If this was you, no action is needed. If you don't recognize this activity, please change your password immediately and enable two-factor authentication.
        </p>
        <div style="text-align:center">
          <a href="${process.env.FRONTEND_URL || 'https://beacon.qzz.io'}/settings/security" style="display:inline-block;padding:14px 32px;background:#ed4245;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
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
        <p style="color:#4f545c;font-size:15px;line-height:1.6;margin:0 0 16px">
          Your server backup has been generated and is ready for download.
        </p>
        <p style="color:#72767d;font-size:13px;line-height:1.5;margin:0">
          You can access your backup from your server settings. Backups are retained for 7 days.
        </p>
      `),
    });
  }

  static async sendSystemUpdateNotice(email: string, version: string, releaseNotes: string) {
    return this.sendWithRetry({
      from: this.getFromAddress('noreply'),
      to: email,
      subject: `Beacon ${version} is Live! 🚀`,
      html: emailLayout(`What's new in Beacon ${version}`, `
        <p style="color:#4f545c;font-size:15px;line-height:1.6;margin:0 0 16px">
          We've just released a major update to Beacon.
        </p>
        <div style="background:#f8f9fa;border:1px solid #e3e5e8;border-radius:8px;padding:16px;margin:0 0 24px;-webkit-font-smoothing: antialiased;">
          ${releaseNotes}
        </div>
        <div style="text-align:center">
          <a href="${process.env.FRONTEND_URL || 'https://beacon.qzz.io'}/updates" style="display:inline-block;padding:14px 32px;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
            Read Full Patch Notes
          </a>
        </div>
      `),
    });
  }
}
