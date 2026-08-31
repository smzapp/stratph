import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { OfferStatus } from '../common/enums.js';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  microJobId!: string;

  @Column({ type: 'text', nullable: true })
  employerId!: string | null;

  @Column()
  jobseekerId!: string;

  @Column()
  offerType!: string;

  @Column('text')
  message!: string;

  @Column({ type: 'varchar', default: OfferStatus.PENDING })
  status!: OfferStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
