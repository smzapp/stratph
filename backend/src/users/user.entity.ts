import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role, UserStatus } from '../common/enums.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'varchar' })
  role!: Role;

  @Column()
  name!: string;

  @Column({ type: 'varchar', default: UserStatus.ACTIVE })
  status!: UserStatus;

  @CreateDateColumn()
  createdAt!: Date;

  // Employer-only fields
  @Column({ type: 'text', nullable: true })
  companyName!: string | null;

  @Column({ type: 'text', nullable: true })
  companyBlurb!: string | null;

  @Column({ type: 'boolean', nullable: true })
  verified!: boolean | null;

  @Column({ type: 'text', nullable: true })
  subscriptionPlan!: string | null;

  @Column({ type: 'datetime', nullable: true })
  subscriptionExpiresAt!: Date | null;

  // Jobseeker-only fields
  @Column({ type: 'text', nullable: true })
  headline!: string | null;

  @Column({ type: 'text', nullable: true })
  location!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  skills!: string[] | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'boolean', nullable: true })
  discoverable!: boolean | null;

  @Column({ type: 'text', nullable: true })
  category!: string | null;

  @Column({ type: 'int', nullable: true })
  yearsOfExperience!: number | null;

  @Column({ type: 'text', nullable: true })
  preferredJobType!: string | null;

  @Column({ type: 'int', default: 0 })
  profileViews!: number;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}
