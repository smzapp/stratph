import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('talent_list_members')
@Index(['listId', 'jobseekerId'], { unique: true })
export class TalentListMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  listId!: string;

  @Column()
  jobseekerId!: string;

  @Column()
  addedBy!: string;

  @CreateDateColumn()
  addedAt!: Date;
}
