import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { UsersService } from '../users/users.service.js';
import { MicroJobsService } from '../micro-jobs/micro-jobs.service.js';
import { JobsService } from '../jobs/jobs.service.js';
import { ActivityService } from '../activity/activity.service.js';
import { OffersService } from '../offers/offers.service.js';
import { RecommendationsService } from '../recommendations/recommendations.service.js';
import { toSafeUser } from '../users/user.entity.js';
import { serializeMicroJob } from '../micro-jobs/micro-job.entity.js';

@UseGuards(JwtAuthGuard)
@Controller('bootstrap')
export class BootstrapController {
  constructor(
    private readonly usersService: UsersService,
    private readonly microJobsService: MicroJobsService,
    private readonly jobsService: JobsService,
    private readonly activityService: ActivityService,
    private readonly offersService: OffersService,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  async get() {
    const [users, microJobs, jobs, activity, offers, recommendations] = await Promise.all([
      this.usersService.findAll(),
      this.microJobsService.findAllWithApplicants(),
      this.jobsService.findAll(),
      this.activityService.findAll(),
      this.offersService.findAll(),
      this.recommendationsService.findAll(),
    ]);

    return {
      users: users.map(toSafeUser),
      microJobs: microJobs.map(serializeMicroJob),
      jobs,
      activity,
      offers,
      recommendations,
    };
  }
}
