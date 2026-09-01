import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('recommendations')
@Index(['employerId', 'jobseekerId'], { unique: true })
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employerId!: string;

  @Column()
  jobseekerId!: string;

  @Column('text')
  message!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
