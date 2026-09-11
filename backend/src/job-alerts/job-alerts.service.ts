import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import { Role } from '../common/enums.js';

export interface JobAlertDetails {
  title: string;
  companyName: string;
  category: string;
  skillsRequired: string[];
  pay?: number;
  link: string;
}

@Injectable()
export class JobAlertsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async notifyMatchingJobseekers(details: JobAlertDetails): Promise<void> {
    if (details.skillsRequired.length === 0) return;

    const jobseekers = await this.usersService.findByRole(Role.JOBSEEKER);
    const requiredSkills = new Set(details.skillsRequired.map((s) => s.toLowerCase()));
    const matches = jobseekers.filter((u) => {
      if (u.jobAlertsEnabled === false) return false;
      const skills = (u.skills ?? []).map((s) => s.toLowerCase());
      return skills.some((s) => requiredSkills.has(s));
    });
    if (matches.length === 0) return;

    const origin = this.config.get<string>('FRONTEND_ORIGIN', 'http://localhost:3000');
    const absoluteLink = `${origin}${details.link}`;

    await Promise.all(
      matches.map((u) =>
        this.mailService.send({
          to: u.email,
          subject: `New match: ${details.title}`,
          html: `
            <p>Hi ${u.name},</p>
            <p><strong>${details.companyName}</strong> just posted something that matches your skills:</p>
            <h3 style="margin-bottom:4px;">${details.title}</h3>
            <p style="color:#555;margin-top:0;">
              ${details.category}${details.pay ? ` · ₱${details.pay.toLocaleString('en-PH')}` : ''}
            </p>
            <p>Matching skills: ${details.skillsRequired.join(', ')}</p>
            <p><a href="${absoluteLink}">View it on StratPH →</a></p>
            <p style="color:#999;font-size:12px;margin-top:24px;">
              You're getting this because job alert emails are on in your StratPH profile.
              Turn them off anytime under My Activity.
            </p>
          `,
        }),
      ),
    );
  }
}
