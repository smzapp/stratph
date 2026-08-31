import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentStatus } from '../common/enums.js';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  microJobId!: string;

  @Column()
  jobseekerId!: string;

  @Column()
  employerId!: string;

  @Column('int')
  amount!: number;

  @Column({ type: 'varchar', default: PaymentStatus.RELEASED })
  status!: PaymentStatus;

  @CreateDateColumn()
  date!: Date;
}
