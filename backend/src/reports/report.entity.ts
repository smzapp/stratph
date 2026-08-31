import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ReportReason, ReportStatus } from '../common/enums.js';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  reporterId!: string;

  @Column()
  reportedUserId!: string;

  @Column({ type: 'varchar' })
  reason!: ReportReason;

  @Column({ type: 'text', nullable: true })
  details!: string | null;

  @Column({ type: 'text', nullable: true })
  contextLabel!: string | null;

  @Column({ type: 'varchar', default: ReportStatus.OPEN })
  status!: ReportStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
