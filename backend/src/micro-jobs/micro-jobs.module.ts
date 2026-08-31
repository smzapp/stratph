import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicroJob } from './micro-job.entity.js';
import { Applicant } from './applicant.entity.js';
import { Offer } from '../offers/offer.entity.js';
import { ActivityEntry } from '../activity/activity.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { MicroJobsService } from './micro-jobs.service.js';
import { MicroJobsController } from './micro-jobs.controller.js';
import { SettingsModule } from '../settings/settings.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([MicroJob, Applicant, Offer, ActivityEntry, Payment]),
    SettingsModule,
  ],
  controllers: [MicroJobsController],
  providers: [MicroJobsService],
  exports: [MicroJobsService],
})
export class MicroJobsModule {}
