import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity.js';
import { NotificationsGateway } from './notifications.gateway.js';
import type { NotificationType } from '../common/enums.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notificationsRepo: Repository<Notification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ): Promise<Notification> {
    const notification = await this.notificationsRepo.save(
      this.notificationsRepo.create({ userId, type, title, message, link: link ?? null }),
    );
    this.gateway.emitToUser(userId, 'notification', notification);
    return notification;
  }

  // For features (like chat) that need to push a live event without it being a
  // persisted, bell-icon notification.
  emitToSocket(userId: string, event: string, payload: unknown): void {
    this.gateway.emitToUser(userId, event, payload);
  }

  async notifyMany(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ): Promise<void> {
    await Promise.all(userIds.map((id) => this.notify(id, type, title, message, link)));
  }

  findForUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.notificationsRepo.update({ id, userId }, { read: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationsRepo.update({ userId, read: false }, { read: true });
  }
}
