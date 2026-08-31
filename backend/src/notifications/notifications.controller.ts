import { Controller, Get, HttpCode, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { NotificationsService } from './notifications.service.js';
import type { User } from '../users/user.entity.js';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.notificationsService.findForUser(user.id);
  }

  @HttpCode(200)
  @Patch(':id/read')
  async markRead(@CurrentUser() user: User, @Param('id') id: string) {
    await this.notificationsService.markRead(id, user.id);
    return { ok: true };
  }

  @HttpCode(200)
  @Patch('read-all')
  async markAllRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllRead(user.id);
    return { ok: true };
  }
}
