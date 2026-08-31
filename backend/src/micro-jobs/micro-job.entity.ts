import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { MicroJobStatus, ModerationStatus } from '../common/enums.js';
import { serializeApplicant } from './applicant.entity.js';
import type { Applicant } from './applicant.entity.js';

@Entity('micro_jobs')
export class MicroJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employerId!: string;

  @Column()
  title!: string;

  @Column()
  category!: string;

  @Column('text')
  description!: string;

  @Column('text')
  deliverable!: string;

  @Column('int')
  pay!: number;

  @Column()
  estimatedTime!: string;

  @Column({ type: 'simple-json' })
  skillsRequired!: string[];

  @Column({ type: 'varchar', default: MicroJobStatus.OPEN })
  status!: MicroJobStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'varchar', default: ModerationStatus.PENDING })
  moderation!: ModerationStatus;

  @Column({ type: 'datetime', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'int', nullable: true })
  minYearsOfExperience!: number | null;

  @Column({ type: 'int', nullable: true })
  minProfileCompleteness!: number | null;
}

// The persisted `status` only ever transitions between OPEN and CLOSED —
// "expired" is derived at read time from `expiresAt` so we don't need a
// background job to flip it.
export function computeMicroJobStatus(mj: Pick<MicroJob, 'status' | 'expiresAt'>): MicroJobStatus {
  if (mj.status === MicroJobStatus.CLOSED) return MicroJobStatus.CLOSED;
  if (mj.expiresAt && new Date(mj.expiresAt).getTime() < Date.now()) return MicroJobStatus.EXPIRED;
  return mj.status;
}

export function serializeMicroJob(mj: MicroJob & { applicants: Applicant[] }) {
  return {
    id: mj.id,
    employerId: mj.employerId,
    title: mj.title,
    category: mj.category,
    description: mj.description,
    deliverable: mj.deliverable,
    pay: mj.pay,
    estimatedTime: mj.estimatedTime,
    skillsRequired: mj.skillsRequired,
    status: computeMicroJobStatus(mj),
    createdAt: mj.createdAt,
    moderation: mj.moderation,
    expiresAt: mj.expiresAt,
    minYearsOfExperience: mj.minYearsOfExperience,
    minProfileCompleteness: mj.minProfileCompleteness,
    applicants: (mj.applicants || []).map(serializeApplicant),
  };
}
