import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ModerationStatus } from '../common/enums.js';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employerId!: string;

  @Column()
  title!: string;

  @Column()
  type!: string;

  @Column()
  location!: string;

  @Column()
  salaryRange!: string;

  @Column({ type: 'simple-json' })
  skillsRequired!: string[];

  @CreateDateColumn()
  postedAt!: Date;

  @Column({ type: 'int', default: 0 })
  applicants!: number;

  @Column({ default: 'open' })
  status!: string;

  @Column({ type: 'varchar', default: ModerationStatus.PENDING })
  moderation!: ModerationStatus;
}
