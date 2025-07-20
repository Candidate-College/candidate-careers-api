/**
 * EmailService
 *
 * Provides a thin abstraction over nodemailer to send transactional emails.
 * Currently supports sending welcome emails to newly registered users. In tests
 * the transport is automatically mocked to avoid real network calls.
 *
 * @module src/services/email/email-service
 */

import nodemailer from 'nodemailer';

class EmailService {
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
}

export const emailService = new EmailService();
