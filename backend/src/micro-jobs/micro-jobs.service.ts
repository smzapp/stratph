import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MicroJob } from './micro-job.entity.js';
import { Applicant } from './applicant.entity.js';
import { Offer } from '../offers/offer.entity.js';
import { ActivityEntry } from '../activity/activity.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { ActivityType, ApplicantStatus, ModerationStatus, MicroJobStatus, OfferStatus, PaymentStatus } from '../common/enums.js';
import { SettingsService } from '../settings/settings.service.js';
import type { CreateMicroJobDto } from './dto/create-micro-job.dto.js';
import type { SubmitDeliverableDto } from './dto/submit-deliverable.dto.js';
import type { ReviewSubmissionDto } from './dto/review-submission.dto.js';
import type { UpgradeCandidateDto } from './dto/upgrade-candidate.dto.js';

export type MicroJobWithApplicants = MicroJob & { applicants: Applicant[] };

@Injectable()
export class MicroJobsService {
  constructor(
    @InjectRepository(MicroJob) private readonly microJobsRepo: Repository<MicroJob>,
    @InjectRepository(Applicant) private readonly applicantsRepo: Repository<Applicant>,
    @InjectRepository(Offer) private readonly offersRepo: Repository<Offer>,
    @InjectRepository(ActivityEntry) private readonly activityRepo: Repository<ActivityEntry>,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    private readonly settingsService: SettingsService,
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
    const settings = await this.settingsService.get();
    const microJob = this.microJobsRepo.create({
      ...dto,
      employerId,
      status: MicroJobStatus.OPEN,
      moderation: settings.microJobAutoApprove ? ModerationStatus.APPROVED : ModerationStatus.PENDING,
    });
    const saved = await this.microJobsRepo.save(microJob);
    return { ...saved, applicants: [] };
  }

  async apply(microJobId: string, jobseekerId: string): Promise<MicroJobWithApplicants> {
    const microJob = await this.findOneOrFail(microJobId);
    const existing = microJob.applicants.find((a) => a.jobseekerId === jobseekerId);
    if (existing) return microJob;

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
      await this.paymentsRepo.save(
        this.paymentsRepo.create({
          microJobId,
          jobseekerId,
          employerId,
          amount: microJob.pay,
          status: PaymentStatus.RELEASED,
        }),
      );
    }

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

    return this.findOneOrFail(microJobId);
  }

  async moderate(microJobId: string, moderation: ModerationStatus): Promise<MicroJobWithApplicants> {
    await this.findOneOrFail(microJobId);
    await this.microJobsRepo.update(microJobId, { moderation });
    return this.findOneOrFail(microJobId);
  }
}
