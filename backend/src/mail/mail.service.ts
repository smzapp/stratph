import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;
  private readonly fromName: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST');
    const port = this.config.get<string>('MAIL_PORT');
    const user = this.config.get<string>('MAIL_USERNAME');
    const pass = this.config.get<string>('MAIL_PASSWORD');
    this.fromAddress = this.config.get<string>('MAIL_FROM_ADDRESS', 'no-reply@stratph.app');
    this.fromName = this.config.get<string>('MAIL_FROM_NAME', 'StratPH');

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        auth: { user, pass },
      });
    } else {
      this.transporter = null;
      this.logger.warn(
        'MAIL_HOST/MAIL_PORT/MAIL_USERNAME/MAIL_PASSWORD are not set — emails will be logged instead of ' +
          'sent. Add your Mailtrap sandbox credentials to backend/.env to enable real sending (see .env.example).',
      );
    }
  }

  async send(message: MailMessage): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[mail not configured, skipped] To: ${message.to} — "${message.subject}"`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${message.to}: ${(err as Error).message}`);
    }
  }
}
