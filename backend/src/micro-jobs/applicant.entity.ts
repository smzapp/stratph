import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ApplicantStatus } from '../common/enums.js';

@Entity('micro_job_applicants')
@Index(['microJobId', 'jobseekerId'], { unique: true })
export class Applicant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Plain FK column only (no TypeORM relation decorator) to avoid a
  // circular ESM import with MicroJob, which would break decorator
  // metadata emission at module-load time.
  @Column()
  microJobId!: string;

  @Column()
  jobseekerId!: string;

  @Column({ type: 'varchar', default: ApplicantStatus.APPLIED })
  status!: ApplicantStatus;

  @CreateDateColumn()
  appliedAt!: Date;

  @Column({ type: 'text', nullable: true })
  submissionNote!: string | null;

  @Column({ type: 'text', nullable: true })
  submissionLink!: string | null;

  @Column({ type: 'datetime', nullable: true })
  submittedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  feedback!: string | null;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt!: Date | null;
}

export function serializeApplicant(a: Applicant) {
  return {
    jobseekerId: a.jobseekerId,
    status: a.status,
    appliedAt: a.appliedAt,
    submission:
      a.submissionNote !== null || a.submissionLink !== null
        ? { note: a.submissionNote ?? '', link: a.submissionLink ?? '', submittedAt: a.submittedAt }
        : undefined,
    feedback: a.feedback ?? undefined,
    reviewedAt: a.reviewedAt ?? undefined,
  };
}
