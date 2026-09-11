import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicroJob } from './micro-job.entity.js';
import { Applicant } from './applicant.entity.js';
import { Offer } from '../offers/offer.entity.js';
import { ActivityEntry } from '../activity/activity.entity.js';
import { MicroJobsService } from './micro-jobs.service.js';
import { MicroJobsController } from './micro-jobs.controller.js';
import { SettingsModule } from '../settings/settings.module.js';
import { UsersModule } from '../users/users.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { FollowsModule } from '../follows/follows.module.js';
import { JobAlertsModule } from '../job-alerts/job-alerts.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([MicroJob, Applicant, Offer, ActivityEntry]),
    SettingsModule,
    UsersModule,
    NotificationsModule,
    FollowsModule,
    JobAlertsModule,
  ],
  controllers: [MicroJobsController],
  providers: [MicroJobsService],
  exports: [MicroJobsService],
})
export class MicroJobsModule {}
