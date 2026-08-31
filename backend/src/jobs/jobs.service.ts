import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity.js';
import { UsersService } from '../users/users.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ModerationStatus, NotificationType, Role } from '../common/enums.js';
import type { CreateJobDto } from './dto/create-job.dto.js';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobsRepo: Repository<Job>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(): Promise<Job[]> {
    return this.jobsRepo.find({ order: { postedAt: 'DESC' } });
  }

  async create(employerId: string, dto: CreateJobDto): Promise<Job> {
    const employer = await this.usersService.findById(employerId);
    const autoApprove = this.usersService.hasActiveSubscription(employer);

    const job = this.jobsRepo.create({
      ...dto,
      employerId,
      status: 'open',
      applicants: 0,
      moderation: autoApprove ? ModerationStatus.APPROVED : ModerationStatus.PENDING,
    });
    const saved = await this.jobsRepo.save(job);

    if (autoApprove) {
      await this.notificationsService.notify(
        employerId,
        NotificationType.JOB_APPROVED,
        'Your job posting is live',
        `"${saved.title}" was auto-approved thanks to your ${employer.subscriptionPlan} plan.`,
        '/dashboard/employer/jobs',
      );
    } else {
      const admins = await this.usersService.findByRole(Role.ADMIN);
      await this.notificationsService.notifyMany(
        admins.map((a) => a.id),
        NotificationType.JOB_PENDING,
        'New job posting needs review',
        `"${saved.title}" from ${employer.companyName || employer.name} is waiting for approval.`,
        '/dashboard/admin/jobs',
      );
    }

    return saved;
  }

  async moderate(jobId: string, moderation: ModerationStatus): Promise<Job> {
    const job = await this.jobsRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found.');
    job.moderation = moderation;
    const saved = await this.jobsRepo.save(job);

    await this.notificationsService.notify(
      job.employerId,
      moderation === ModerationStatus.APPROVED ? NotificationType.JOB_APPROVED : NotificationType.JOB_REJECTED,
      moderation === ModerationStatus.APPROVED ? 'Your job posting was approved' : 'Your job posting was rejected',
      moderation === ModerationStatus.APPROVED
        ? `"${saved.title}" is now live for jobseekers to see.`
        : `"${saved.title}" was not approved by our moderation team.`,
      '/dashboard/employer/jobs',
    );

    return saved;
  }
}
