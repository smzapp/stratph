import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { encryptedTextTransformer } from '../common/crypto/encrypted-column.transformer.js';

@Entity('messages')
@Index(['conversationId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  conversationId!: string;

  @Column()
  senderId!: string;

  @Column('text', { nullable: true, transformer: encryptedTextTransformer })
  body!: string | null;

  @Column('text', { nullable: true })
  attachmentUrl!: string | null;

  @Column('text', { nullable: true })
  attachmentName!: string | null;

  @Column('text', { nullable: true })
  attachmentType!: string | null;

  @Column({ type: 'int', nullable: true })
  attachmentSize!: number | null;

  @Column({ type: 'datetime', nullable: true })
  readAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
