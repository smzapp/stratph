import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('talent_lists')
export class TalentList {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // The team's scope id — an employer's own id if they're a team root, or
  // their team owner's id if they're a teammate. Scoping by this (rather
  // than the creating user's id) is what makes lists "shared team" lists.
  @Column()
  ownerTeamId!: string;

  @Column()
  name!: string;

  @Column()
  createdBy!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
