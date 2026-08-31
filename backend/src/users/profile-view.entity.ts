import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('profile_views')
export class ProfileView {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  viewedUserId!: string;

  @Column({ type: 'text', nullable: true })
  viewerId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
