import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('follows')
@Index(['jobseekerId', 'employerId'], { unique: true })
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  jobseekerId!: string;

  @Column()
  employerId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
