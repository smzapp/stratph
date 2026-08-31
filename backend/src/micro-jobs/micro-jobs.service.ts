import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MicroJob, computeMicroJobStatus } from './micro-job.entity.js';
import { Applicant } from './applicant.entity.js';
import { Offer } from '../offers/offer.entity.js';
import { ActivityEntry } from '../activity/activity.entity.js';
import {
  ActivityType,
  ApplicantStatus,
  ModerationStatus,
  MicroJobStatus,
  NotificationType,
  OfferStatus,
  Role,
} from '../common/enums.js';
import { SettingsService } from '../settings/settings.service.js';
import { UsersService } from '../users/users.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { CreateMicroJobDto } from './dto/create-micro-job.dto.js';
import type { SubmitDeliverableDto } from './dto/submit-deliverable.dto.js';
import type { ReviewSubmissionDto } from './dto/review-submission.dto.js';
import type { UpgradeCandidateDto } from './dto/upgrade-candidate.dto.js';
import type { InviteCandidateDto } from './dto/invite-candidate.dto.js';

export type MicroJobWithApplicants = MicroJob & { applicants: Applicant[] };

@Injectable()
export class MicroJobsService {
  constructor(
    @InjectRepository(MicroJob) private readonly microJobsRepo: Repository<MicroJob>,
    @InjectRepository(Applicant) private readonly applicantsRepo: Repository<Applicant>,
    @InjectRepository(Offer) private readonly offersRepo: Repository<Offer>,
    @InjectRepository(ActivityEntry) private readonly activityRepo: Repository<ActivityEntry>,
    private readonly settingsService: SettingsService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAllWithApplicants(): Promise<MicroJobWithApplicants[]> {
    const [microJobs, applicants] = await Promise.all([
      this.microJobsRepo.find({ order: { createdAt: 'DESC' } }),
      this.applicantsRepo.find(),
    ]);
    const byJob = new Map<string, Applicant[]>();
    for (const a of applicants) {
      const list = byJob.get(a.microJobId) ?? [];
      list.push(a);
      byJob.set(a.microJobId, list);
    }
    return microJobs.map((mj) => ({ ...mj, applicants: byJob.get(mj.id) ?? [] }));
  }

  private async findOneOrFail(id: string): Promise<MicroJobWithApplicants> {
    const microJob = await this.microJobsRepo.findOne({ where: { id } });
    if (!microJob) throw new NotFoundException('Micro job not found.');
    const applicants = await this.applicantsRepo.find({ where: { microJobId: id } });
    return { ...microJob, applicants };
  }

  async create(employerId: string, dto: CreateMicroJobDto): Promise<MicroJobWithApplicants> {
    const employer = await this.usersService.findById(employerId);
    if (!this.usersService.hasActiveSubscription(employer)) {
      throw new ForbiddenException(
        'An active subscription is required to post Trial Tasks. Subscribe on the Pricing page to continue.',
      );
    }

    const settings = await this.settingsService.get();
    const microJob = this.microJobsRepo.create({
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      minYearsOfExperience: dto.minYearsOfExperience ?? null,
      minProfileCompleteness: dto.minProfileCompleteness ?? null,
      employerId,
      status: MicroJobStatus.OPEN,
      moderation: settings.microJobAutoApprove ? ModerationStatus.APPROVED : ModerationStatus.PENDING,
    });
    const saved = await this.microJobsRepo.save(microJob);

    if (saved.moderation === ModerationStatus.PENDING) {
      const admins = await this.usersService.findByRole(Role.ADMIN);
      await this.notificationsService.notifyMany(
        admins.map((a) => a.id),
        NotificationType.MICRO_JOB_PENDING,
        'New trial task needs review',
        `"${saved.title}" from ${employer.companyName || employer.name} is waiting for approval.`,
        '/dashboard/admin/micro-jobs',
      );
    }

    return { ...saved, applicants: [] };
  }

  async apply(microJobId: string, jobseekerId: string): Promise<MicroJobWithApplicants> {
    const microJob = await this.findOneOrFail(microJobId);
    const existing = microJob.applicants.find((a) => a.jobseekerId === jobseekerId);
    if (existing) return microJob;

    if (computeMicroJobStatus(microJob) !== MicroJobStatus.OPEN) {
      throw new BadRequestException('This Trial Task is no longer accepting applicants.');
    }

    const jobseeker = await this.usersService.findById(jobseekerId);
    if (
      microJob.minYearsOfExperience !== null &&
      (jobseeker.yearsOfExperience ?? 0) < microJob.minYearsOfExperience
    ) {
      throw new ForbiddenException(
        `This Trial Task requires at least ${microJob.minYearsOfExperience} years of experience.`,
      );
    }
    if (microJob.minProfileCompleteness !== null) {
      const completeness = this.usersService.computeProfileCompleteness(jobseeker);
      if (completeness < microJob.minProfileCompleteness) {
        throw new ForbiddenException(
          `This Trial Task requires at least ${microJob.minProfileCompleteness}% profile completeness. Yours is ${completeness}%.`,
        );
      }
    }

    await this.applicantsRepo.save(
      this.applicantsRepo.create({
        microJobId,
        jobseekerId,
        status: ApplicantStatus.APPLIED,
      }),
    );
    return this.findOneOrFail(microJobId);
  }

  async submit(microJobId: string, jobseekerId: string, dto: SubmitDeliverableDto): Promise<MicroJobWithApplicants> {
    const microJob = await this.findOneOrFail(microJobId);
    const applicant = microJob.applicants.find((a) => a.jobseekerId === jobseekerId);
    if (!applicant) throw new BadRequestException('You have not applied to this micro job.');

    applicant.status = ApplicantStatus.SUBMITTED;
    applicant.submissionNote = dto.note;
    applicant.submissionLink = dto.link;
    applicant.submittedAt = new Date();
    await this.applicantsRepo.save(applicant);

    const jobseeker = await this.usersService.findById(jobseekerId);
    await this.notificationsService.notify(
      microJob.employerId,
      NotificationType.SUBMISSION_RECEIVED,
      'New submission to review',
      `${jobseeker.name} submitted work for "${microJob.title}".`,
      `/dashboard/employer/micro-jobs/${microJobId}`,
    );

    return this.findOneOrFail(microJobId);
  }

  async review(
    microJobId: string,
    jobseekerId: string,
    employerId: string,
    dto: ReviewSubmissionDto,
  ): Promise<MicroJobWithApplicants> {
    const microJob = await this.findOneOrFail(microJobId);
    if (microJob.employerId !== employerId) {
      throw new ForbiddenException('You can only review submissions for your own micro jobs.');
    }
    const applicant = microJob.applicants.find((a) => a.jobseekerId === jobseekerId);
    if (!applicant) throw new NotFoundException('Applicant not found.');

    applicant.status = dto.decision;
    applicant.feedback = dto.feedback ?? null;
    applicant.reviewedAt = new Date();
    await this.applicantsRepo.save(applicant);

    if (dto.decision === ApplicantStatus.APPROVED) {
      await this.activityRepo.save(
        this.activityRepo.create({
          jobseekerId,
          type: ActivityType.MICRO_JOB_COMPLETED,
          skill: microJob.skillsRequired?.[0] ?? microJob.category,
          title: `Completed: ${microJob.title}`,
        }),
      );
    }

    await this.notificationsService.notify(
      jobseekerId,
      NotificationType.SUBMISSION_REVIEWED,
      dto.decision === ApplicantStatus.APPROVED ? 'Payment released — submission approved' : 'Your submission was not selected',
      dto.decision === ApplicantStatus.APPROVED
        ? `Your work on "${microJob.title}" was approved. ₱${microJob.pay.toLocaleString('en-PH')} has been released to you.`
        : `Your work on "${microJob.title}" was not selected. The ₱${microJob.pay.toLocaleString('en-PH')} held for this task has been returned to the employer.`,
      `/dashboard/jobseeker/micro-jobs/${microJobId}`,
    );

    return this.findOneOrFail(microJobId);
  }

  async upgrade(
    microJobId: string,
    jobseekerId: string,
    employerId: string,
    dto: UpgradeCandidateDto,
  ): Promise<MicroJobWithApplicants> {
    const microJob = await this.findOneOrFail(microJobId);
    if (microJob.employerId !== employerId) {
      throw new ForbiddenException('You can only upgrade candidates for your own micro jobs.');
    }
    const applicant = microJob.applicants.find((a) => a.jobseekerId === jobseekerId);
    if (!applicant) throw new NotFoundException('Applicant not found.');

    applicant.status = ApplicantStatus.UPGRADED;
    await this.applicantsRepo.save(applicant);

    await this.offersRepo.save(
      this.offersRepo.create({
        microJobId,
        employerId,
        jobseekerId,
        offerType: dto.offerType,
        message: dto.message,
        status: OfferStatus.PENDING,
      }),
    );

    await this.notificationsService.notify(
      jobseekerId,
      NotificationType.OFFER_RECEIVED,
      "You've got an offer!",
      `You were offered a ${dto.offerType} role after completing "${microJob.title}".`,
      '/dashboard/jobseeker/offers',
    );

    return this.findOneOrFail(microJobId);
  }

  async invite(
    microJobId: string,
    employerId: string,
    dto: InviteCandidateDto,
  ): Promise<MicroJobWithApplicants> {
    const microJob = await this.findOneOrFail(microJobId);
    if (microJob.employerId !== employerId) {
      throw new ForbiddenException('You can only invite candidates to your own Trial Tasks.');
    }

    const employer = await this.usersService.findById(employerId);
    if (!this.usersService.hasActiveSubscription(employer)) {
      throw new ForbiddenException('Inviting candidates requires an active subscription.');
    }

    const jobseeker = await this.usersService.findById(dto.jobseekerId);
    if (jobseeker.role !== Role.JOBSEEKER) {
      throw new BadRequestException('You can only invite jobseeker accounts.');
    }

    const existing = microJob.applicants.find((a) => a.jobseekerId === dto.jobseekerId);
    if (!existing) {
      await this.applicantsRepo.save(
        this.applicantsRepo.create({
          microJobId,
          jobseekerId: dto.jobseekerId,
          status: ApplicantStatus.APPLIED,
          invited: true,
        }),
      );
    }

    await this.notificationsService.notify(
      dto.jobseekerId,
      NotificationType.MICRO_JOB_INVITE,
      "You've been invited to a Trial Task",
      `${employer.companyName || employer.name} invited you to "${microJob.title}".`,
      `/dashboard/jobseeker/micro-jobs/${microJobId}`,
    );

    return this.findOneOrFail(microJobId);
  }

  async close(microJobId: string, employerId: string): Promise<MicroJobWithApplicants> {
    const microJob = await this.findOneOrFail(microJobId);
    if (microJob.employerId !== employerId) {
      throw new ForbiddenException('You can only close your own Trial Tasks.');
    }
    await this.microJobsRepo.update(microJobId, { status: MicroJobStatus.CLOSED });
    return this.findOneOrFail(microJobId);
  }

  async moderate(microJobId: string, moderation: ModerationStatus): Promise<MicroJobWithApplicants> {
    const microJob = await this.findOneOrFail(microJobId);
    await this.microJobsRepo.update(microJobId, { moderation });

    await this.notificationsService.notify(
      microJob.employerId,
      moderation === ModerationStatus.APPROVED ? NotificationType.MICRO_JOB_APPROVED : NotificationType.MICRO_JOB_REJECTED,
      moderation === ModerationStatus.APPROVED ? 'Your trial task was approved' : 'Your trial task was rejected',
      moderation === ModerationStatus.APPROVED
        ? `"${microJob.title}" is now live for jobseekers to see.`
        : `"${microJob.title}" was not approved by our moderation team.`,
      '/dashboard/employer/micro-jobs',
    );

    return this.findOneOrFail(microJobId);
  }
}
