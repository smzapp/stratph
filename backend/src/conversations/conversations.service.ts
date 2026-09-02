import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Not, Repository } from 'typeorm';
import { Conversation } from './conversation.entity.js';
import { Message } from './message.entity.js';
import { UsersService } from '../users/users.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { Role } from '../common/enums.js';
import type { User } from '../users/user.entity.js';

export interface ConversationSummary {
  id: string;
  otherParty: { id: string; name: string; companyName: string | null; role: Role };
  lastMessagePreview: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  closed: boolean;
  archived: boolean;
  createdAt: Date;
}

// Once a conversation is closed, the other party's identity is masked
// wherever this conversation is displayed — the thread is a closed record at
// that point, not an ongoing relationship with that person.
const CLOSED_PARTY_NAME = 'User';

export interface AttachmentInput {
  url: string;
  name: string;
  type: string;
  size: number;
}

const DEFAULT_MESSAGE_PAGE_SIZE = 30;

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation) private readonly conversationsRepo: Repository<Conversation>,
    @InjectRepository(Message) private readonly messagesRepo: Repository<Message>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async findOneOrFail(id: string): Promise<Conversation> {
    const conversation = await this.conversationsRepo.findOne({ where: { id } });
    if (!conversation) throw new NotFoundException('Conversation not found.');
    return conversation;
  }

  private assertParticipant(conversation: Conversation, userId: string): void {
    if (conversation.employerId !== userId && conversation.jobseekerId !== userId) {
      throw new ForbiddenException('You are not part of this conversation.');
    }
  }

  private assertOpen(conversation: Conversation): void {
    if (conversation.closedAt) {
      throw new ForbiddenException('This conversation is closed.');
    }
  }

  async startOrGet(currentUser: User, otherUserId: string): Promise<Conversation> {
    if (otherUserId === currentUser.id) {
      throw new BadRequestException('You cannot start a conversation with yourself.');
    }
    const other = await this.usersService.findById(otherUserId);

    let employerId: string;
    let jobseekerId: string;

    if (currentUser.role === Role.EMPLOYER && other.role === Role.JOBSEEKER) {
      if (!this.usersService.hasActiveSubscription(currentUser)) {
        throw new ForbiddenException('Messaging candidates requires an active subscription.');
      }
      employerId = currentUser.id;
      jobseekerId = other.id;
    } else if (currentUser.role === Role.JOBSEEKER && other.role === Role.EMPLOYER) {
      employerId = other.id;
      jobseekerId = currentUser.id;
      // A closed conversation doesn't count as "existing" here — only the
      // employer re-opening contact creates a new thread; the jobseeker
      // can't revive a closed one or start one from scratch.
      const existing = await this.conversationsRepo.findOne({
        where: { employerId, jobseekerId, closedAt: IsNull() },
        order: { createdAt: 'DESC' },
      });
      if (!existing) {
        throw new ForbiddenException('Only employers can start a new conversation.');
      }
      return existing;
    } else {
      throw new BadRequestException('Conversations are only between employers and jobseekers.');
    }

    // Reuse the active thread if there is one; a closed thread with this
    // jobseeker is left alone and a fresh conversation is started instead.
    const existing = await this.conversationsRepo.findOne({
      where: { employerId, jobseekerId, closedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (existing) return existing;

    return this.conversationsRepo.save(this.conversationsRepo.create({ employerId, jobseekerId }));
  }

  async findForUser(userId: string): Promise<ConversationSummary[]> {
    const conversations = await this.conversationsRepo.find({
      where: [{ employerId: userId }, { jobseekerId: userId }],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });
    if (conversations.length === 0) return [];

    const otherIds = [...new Set(conversations.map((c) => (c.employerId === userId ? c.jobseekerId : c.employerId)))];
    const others = await Promise.all(otherIds.map((id) => this.usersService.findById(id).catch(() => null)));
    const otherById = new Map(others.filter((u) => u !== null).map((u) => [u.id, u]));

    const unreadCounts = await Promise.all(
      conversations.map((c) =>
        this.messagesRepo.count({
          where: { conversationId: c.id, senderId: Not(userId), readAt: IsNull() },
        }),
      ),
    );

    return conversations.map((c, i) => {
      const otherId = c.employerId === userId ? c.jobseekerId : c.employerId;
      const other = otherById.get(otherId);
      const closed = Boolean(c.closedAt);
      return {
        id: c.id,
        otherParty: {
          id: otherId,
          name: closed ? CLOSED_PARTY_NAME : (other?.name ?? 'Unknown user'),
          companyName: closed ? null : (other?.companyName ?? null),
          role: other?.role ?? (c.employerId === otherId ? Role.EMPLOYER : Role.JOBSEEKER),
        },
        lastMessagePreview: c.lastMessagePreview,
        lastMessageAt: c.lastMessageAt,
        unreadCount: unreadCounts[i],
        closed,
        archived: this.isArchivedFor(c, userId),
        createdAt: c.createdAt,
      };
    });
  }

  private isArchivedFor(conversation: Conversation, userId: string): boolean {
    return Boolean(
      conversation.employerId === userId ? conversation.archivedByEmployerAt : conversation.archivedByJobseekerAt,
    );
  }

  private async buildSummary(conversation: Conversation, userId: string): Promise<ConversationSummary> {
    const otherId = conversation.employerId === userId ? conversation.jobseekerId : conversation.employerId;
    const other = await this.usersService.findById(otherId).catch(() => null);
    const unreadCount = await this.messagesRepo.count({
      where: { conversationId: conversation.id, senderId: Not(userId), readAt: IsNull() },
    });
    const closed = Boolean(conversation.closedAt);
    return {
      id: conversation.id,
      otherParty: {
        id: otherId,
        name: closed ? CLOSED_PARTY_NAME : (other?.name ?? 'Unknown user'),
        companyName: closed ? null : (other?.companyName ?? null),
        role: other?.role ?? (conversation.employerId === otherId ? Role.EMPLOYER : Role.JOBSEEKER),
      },
      lastMessagePreview: conversation.lastMessagePreview,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount,
      closed,
      archived: this.isArchivedFor(conversation, userId),
      createdAt: conversation.createdAt,
    };
  }

  async findMessages(
    conversationId: string,
    userId: string,
    options?: { before?: string; limit?: number },
  ): Promise<Message[]> {
    const conversation = await this.findOneOrFail(conversationId);
    this.assertParticipant(conversation, userId);

    const limit = options?.limit && options.limit > 0 ? Math.min(options.limit, 100) : DEFAULT_MESSAGE_PAGE_SIZE;
    const page = await this.messagesRepo.find({
      where: {
        conversationId,
        ...(options?.before ? { createdAt: LessThan(new Date(options.before)) } : {}),
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return page.reverse().map((m) => this.sanitize(m));
  }

  // A deleted message stays in the database as-is — only what we hand back
  // over the API/socket is scrubbed, so "deleted" only ever means "hidden in
  // the UI", never "gone from storage".
  private sanitize(message: Message): Message {
    if (!message.deletedAt) return message;
    return {
      ...message,
      body: null,
      attachmentUrl: null,
      attachmentName: null,
      attachmentType: null,
      attachmentSize: null,
    };
  }

  private async recordAndBroadcast(
    conversation: Conversation,
    sender: User,
    fields: Pick<
      Message,
      'body' | 'attachmentUrl' | 'attachmentName' | 'attachmentType' | 'attachmentSize'
    >,
    preview: string,
  ): Promise<Message> {
    const message = await this.messagesRepo.save(
      this.messagesRepo.create({ conversationId: conversation.id, senderId: sender.id, ...fields }),
    );
    await this.conversationsRepo.update(conversation.id, {
      lastMessageAt: message.createdAt,
      lastMessagePreview: preview.slice(0, 140),
    });

    // Delivery is entirely socket-driven — chat has its own unread badge on the
    // Messages nav item, so it deliberately doesn't also raise a bell notification.
    const recipientId =
      conversation.employerId === sender.id ? conversation.jobseekerId : conversation.employerId;
    this.notificationsService.emitToSocket(recipientId, 'message:new', { conversationId: conversation.id, message });

    return message;
  }

  async sendMessage(conversationId: string, sender: User, body: string): Promise<Message> {
    const conversation = await this.findOneOrFail(conversationId);
    this.assertParticipant(conversation, sender.id);
    this.assertOpen(conversation);

    return this.recordAndBroadcast(
      conversation,
      sender,
      { body, attachmentUrl: null, attachmentName: null, attachmentType: null, attachmentSize: null },
      body,
    );
  }

  async sendAttachment(
    conversationId: string,
    sender: User,
    attachment: AttachmentInput,
    body?: string,
  ): Promise<Message> {
    const conversation = await this.findOneOrFail(conversationId);
    this.assertParticipant(conversation, sender.id);
    this.assertOpen(conversation);

    const caption = body?.trim() || null;
    return this.recordAndBroadcast(
      conversation,
      sender,
      {
        body: caption,
        attachmentUrl: attachment.url,
        attachmentName: attachment.name,
        attachmentType: attachment.type,
        attachmentSize: attachment.size,
      },
      caption || `📎 ${attachment.name}`,
    );
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.findOneOrFail(conversationId);
    this.assertParticipant(conversation, userId);

    await this.messagesRepo.update(
      { conversationId, senderId: Not(userId), readAt: IsNull() },
      { readAt: new Date() },
    );

    const otherId = conversation.employerId === userId ? conversation.jobseekerId : conversation.employerId;
    this.notificationsService.emitToSocket(otherId, 'message:read', { conversationId, readBy: userId });
  }

  async deleteMessage(conversationId: string, messageId: string, userId: string): Promise<Message> {
    const conversation = await this.findOneOrFail(conversationId);
    this.assertParticipant(conversation, userId);

    const message = await this.messagesRepo.findOne({ where: { id: messageId, conversationId } });
    if (!message) throw new NotFoundException('Message not found.');
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages.');
    }

    if (!message.deletedAt) {
      message.deletedAt = new Date();
      await this.messagesRepo.save(message);

      if (conversation.lastMessageAt?.getTime() === message.createdAt.getTime()) {
        await this.conversationsRepo.update(conversation.id, {
          lastMessagePreview: 'This message was deleted',
        });
      }
    }

    const sanitized = this.sanitize(message);
    const recipientId = conversation.employerId === userId ? conversation.jobseekerId : conversation.employerId;
    this.notificationsService.emitToSocket(recipientId, 'message:deleted', {
      conversationId,
      message: sanitized,
    });

    return sanitized;
  }

  // Permanently stops the thread (either participant can do this) — message
  // history stays intact, but nothing new can be sent and the other party's
  // name is masked everywhere this conversation shows up. There's no reopen;
  // the next contact between the same two people starts a new conversation.
  async closeConversation(conversationId: string, userId: string): Promise<ConversationSummary> {
    const conversation = await this.findOneOrFail(conversationId);
    this.assertParticipant(conversation, userId);

    if (!conversation.closedAt) {
      conversation.closedAt = new Date();
      await this.conversationsRepo.update(conversation.id, { closedAt: conversation.closedAt });

      const otherId = conversation.employerId === userId ? conversation.jobseekerId : conversation.employerId;
      this.notificationsService.emitToSocket(otherId, 'conversation:closed', { conversationId: conversation.id });
    }

    return this.buildSummary(conversation, userId);
  }

  // Archiving only affects the caller's own inbox view — it's stored per
  // role rather than as a shared flag.
  async setArchived(conversationId: string, userId: string, archived: boolean): Promise<ConversationSummary> {
    const conversation = await this.findOneOrFail(conversationId);
    this.assertParticipant(conversation, userId);

    const isEmployer = conversation.employerId === userId;
    const at = archived ? new Date() : null;
    if (isEmployer) {
      conversation.archivedByEmployerAt = at;
      await this.conversationsRepo.update(conversation.id, { archivedByEmployerAt: at });
    } else {
      conversation.archivedByJobseekerAt = at;
      await this.conversationsRepo.update(conversation.id, { archivedByJobseekerAt: at });
    }

    return this.buildSummary(conversation, userId);
  }
}
