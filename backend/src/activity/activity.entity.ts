import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ActivityType } from '../common/enums.js';

@Entity('activity_entries')
export class ActivityEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  jobseekerId!: string;

  @Column({ type: 'varchar' })
  type!: ActivityType;

  @Column({ type: 'text', nullable: true })
  skill!: string | null;

  @Column()
  title!: string;

  @CreateDateColumn()
  date!: Date;
}
