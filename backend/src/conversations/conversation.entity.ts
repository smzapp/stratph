import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { encryptedTextTransformer } from '../common/crypto/encrypted-column.transformer.js';

@Entity('conversations')
// No longer unique — closing a conversation lets the employer start a fresh
// one with the same jobseeker later, so a pair can have several rows over
// time (at most one of them active, i.e. closedAt IS NULL).
@Index(['employerId', 'jobseekerId'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employerId!: string;

  @Column()
  jobseekerId!: string;

  @Column({ type: 'text', nullable: true, transformer: encryptedTextTransformer })
  lastMessagePreview!: string | null;

  @Column({ type: 'datetime', nullable: true })
  lastMessageAt!: Date | null;

  // Set once either participant "closes" the thread — stops new messages
  // but keeps history intact. A closed conversation never reopens; the next
  // contact between the same two people creates a new row instead.
  @Column({ type: 'datetime', nullable: true })
  closedAt!: Date | null;

  // Archiving is per-participant (each side can tidy their own inbox without
  // affecting the other), so it needs one column per role rather than a
  // single shared flag.
  @Column({ type: 'datetime', nullable: true })
  archivedByEmployerAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  archivedByJobseekerAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
