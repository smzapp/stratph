import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity.js';
import { MicroJob } from '../micro-jobs/micro-job.entity.js';
import { Applicant } from '../micro-jobs/applicant.entity.js';
import { Job } from '../jobs/job.entity.js';
import { ActivityEntry } from '../activity/activity.entity.js';
import { Offer } from '../offers/offer.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, MicroJob, Applicant, Job, ActivityEntry, Offer, Payment]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
