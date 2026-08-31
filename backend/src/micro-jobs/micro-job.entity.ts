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
    status: mj.status,
    createdAt: mj.createdAt,
    moderation: mj.moderation,
    applicants: (mj.applicants || []).map(serializeApplicant),
  };
}
