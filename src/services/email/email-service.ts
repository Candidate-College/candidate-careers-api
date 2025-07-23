/**
 * Email Service
 *
 * Provides email sending utilities for the application, including job status workflow notifications.
 *
 * @module services/email/email-service
 */

import nodemailer from 'nodemailer';

export class EmailService {
  private readonly transporter: any;

  constructor() {
    // In test environment use ethereal mock account automatically
    if (process.env.NODE_ENV === 'test') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailerMock = require('nodemailer-mock');
      this.transporter = nodemailerMock.createTransport({});
    } else {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendWelcomeEmail(to: string, name: string, password: string) {
    const html = `<p>Hello ${name},</p><p>Your account has been created.</p><p>Temporary password: <strong>${password}</strong></p>`;
    await this.transporter.sendMail({
      from: 'no-reply@careers.local',
      to,
      subject: 'Welcome to CC Career',
      html,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, newPassword: string) {
    const html = `<p>Hello ${name},</p><p>Your password has been reset.</p><p>New password: <strong>${newPassword}</strong></p><p>Please change your password after logging in.</p>`;
    await this.transporter.sendMail({
      from: 'no-reply@careers.local',
      to,
      subject: 'Password Reset - CC Career',
      html,
    });
  }

  async sendAccountStatusNotification(to: string, name: string, status: string) {
    const statusMessages = {
      active: 'Your account has been activated.',
      inactive: 'Your account has been deactivated.',
      suspended: 'Your account has been suspended.',
    };

    const html = `<p>Hello ${name},</p><p>${
      statusMessages[status as keyof typeof statusMessages] ||
      'Your account status has been updated.'
    }</p>`;
    await this.transporter.sendMail({
      from: 'no-reply@careers.local',
      to,
      subject: `Account Status Update - CC Career`,
      html,
    });
  }

  async sendRoleChangeNotification(to: string, name: string, oldRole?: string, newRole?: string) {
    const html = `<p>Hello ${name},</p><p>Your role has been updated.</p>${
      oldRole ? `<p>Previous role: ${oldRole}</p>` : ''
    }<p>New role: ${newRole || 'No role assigned'}</p>`;
    await this.transporter.sendMail({
      from: 'no-reply@careers.local',
      to,
      subject: 'Role Update - CC Career',
      html,
    });
  }

  /**
   * Send job status transition notification email to stakeholders.
   * @param params - Notification parameters (jobId, fromStatus, toStatus, userId, etc)
   */
  static async sendJobStatusNotification(params: {
    jobId: number;
    fromStatus: string;
    toStatus: string;
    userId: number;
    [key: string]: any;
  }): Promise<void> {
    // Lookup recipients (stub: send to admin and job owner)
    // In real implementation, fetch job posting, owner, and relevant HR emails
    const recipients = params.recipients || [
      process.env.DEFAULT_NOTIFICATION_EMAIL || 'admin@careers.local',
    ];
    const subject = `Job Status Changed: ${params.fromStatus} → ${params.toStatus}`;
    const html = `
      <p>Job Posting ID: <strong>${params.jobId}</strong></p>
      <p>Status changed from <strong>${params.fromStatus}</strong> to <strong>${
      params.toStatus
    }</strong> by user ID <strong>${params.userId}</strong>.</p>
      ${params.transition_reason ? `<p>Reason: ${params.transition_reason}</p>` : ''}
      ${params.close_notes ? `<p>Notes: ${params.close_notes}</p>` : ''}
      <p>Timestamp: ${new Date().toLocaleString()}</p>
    `;
    // Use winston logger for audit
    const { defaultWinstonLogger: winston } = require('@/utilities/winston-logger');
    winston.info('EmailService: sendJobStatusNotification', {
      jobId: params.jobId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      userId: params.userId,
      recipients,
    });
    // Send email to all recipients
    for (const to of recipients) {
      await emailService.transporter.sendMail({
        from: 'no-reply@careers.local',
        to,
        subject,
        html,
      });
    }
  }
}

export const emailService = new EmailService();
