import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PipelineStage } from '../common/enums.js';

@Entity('candidate_pipeline_entries')
@Index(['ownerTeamId', 'jobseekerId'], { unique: true })
export class CandidatePipelineEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  ownerTeamId!: string;

  @Column()
  jobseekerId!: string;

  @Column({ type: 'varchar' })
  stage!: PipelineStage;

  @Column()
  updatedBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
