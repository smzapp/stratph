import { Module } from '@nestjs/common';
import { BootstrapController } from './bootstrap.controller.js';
import { UsersModule } from '../users/users.module.js';
import { MicroJobsModule } from '../micro-jobs/micro-jobs.module.js';
import { JobsModule } from '../jobs/jobs.module.js';
import { ActivityModule } from '../activity/activity.module.js';
import { OffersModule } from '../offers/offers.module.js';

@Module({
  imports: [UsersModule, MicroJobsModule, JobsModule, ActivityModule, OffersModule],
  controllers: [BootstrapController],
})
export class BootstrapModule {}
