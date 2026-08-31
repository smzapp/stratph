import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity.js';
import { ProfileView } from './profile-view.entity.js';
import { Applicant } from '../micro-jobs/applicant.entity.js';
import { Offer } from '../offers/offer.entity.js';
import { ActivityEntry } from '../activity/activity.entity.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { PublicController } from './public.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, ProfileView, Applicant, Offer, ActivityEntry]), NotificationsModule],
  controllers: [UsersController, PublicController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
