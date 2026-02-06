import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.ethereal.email'),
      port: this.configService.get('SMTP_PORT', 587),
      auth: {
        user: this.configService.get('SMTP_USER', ''),
        pass: this.configService.get('SMTP_PASS', ''),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', 'noreply@medpulse.com'),
        to,
        subject,
        html,
      });
      console.log('Email sent:', info.messageId);
      if (info.messageId) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('Preview URL:', previewUrl);
        }
      }
      return info;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${this.configService.get('CORS_ORIGIN')}/reset-password?token=${token}`;
    await this.sendMail(
      to,
      'MedPulse - Password Reset',
      `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    );
  }

  async sendAppointmentReminder(to: string, patientName: string, dateTime: string, doctorName: string) {
    await this.sendMail(
      to,
      'MedPulse - Appointment Reminder',
      `
        <h2>Appointment Reminder</h2>
        <p>Dear ${patientName},</p>
        <p>This is a reminder for your upcoming appointment:</p>
        <ul>
          <li><strong>Date & Time:</strong> ${dateTime}</li>
          <li><strong>Doctor:</strong> Dr. ${doctorName}</li>
        </ul>
        <p>Please arrive 10 minutes early.</p>
        <p>MedPulse Medical Center</p>
      `,
    );
  }
}
