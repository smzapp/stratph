import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './follow.entity.js';
import { FollowsService } from './follows.service.js';
import { FollowsController } from './follows.controller.js';
import { UsersModule } from '../users/users.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Follow]), UsersModule, NotificationsModule],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
