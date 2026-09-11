import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('team_invites')
export class TeamInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  teamOwnerId!: string;

  @Column()
  invitedEmail!: string;

  @Column()
  companyName!: string;

  @Column({ unique: true })
  token!: string;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  acceptedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
