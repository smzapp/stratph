import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums.js';
import { MicroJobsService } from './micro-jobs.service.js';
import { serializeMicroJob } from './micro-job.entity.js';
import { CreateMicroJobDto } from './dto/create-micro-job.dto.js';
import { SubmitDeliverableDto } from './dto/submit-deliverable.dto.js';
import { ReviewSubmissionDto } from './dto/review-submission.dto.js';
import { UpgradeCandidateDto } from './dto/upgrade-candidate.dto.js';
import { ModerateDto } from './dto/moderate.dto.js';
import type { User } from '../users/user.entity.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('micro-jobs')
export class MicroJobsController {
  constructor(private readonly microJobsService: MicroJobsService) {}

  @Roles(Role.EMPLOYER)
  @Post()
  async create(@CurrentUser() user: User, @Body() dto: CreateMicroJobDto) {
    const microJob = await this.microJobsService.create(user.id, dto);
    return serializeMicroJob(microJob);
  }

  @Roles(Role.JOBSEEKER)
  @Post(':id/apply')
  async apply(@CurrentUser() user: User, @Param('id') id: string) {
    const microJob = await this.microJobsService.apply(id, user.id);
    return serializeMicroJob(microJob);
  }

  @Roles(Role.JOBSEEKER)
  @Post(':id/submit')
  async submit(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: SubmitDeliverableDto) {
    const microJob = await this.microJobsService.submit(id, user.id, dto);
    return serializeMicroJob(microJob);
  }

  @Roles(Role.EMPLOYER)
  @Patch(':id/applicants/:jobseekerId/review')
  async review(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('jobseekerId') jobseekerId: string,
    @Body() dto: ReviewSubmissionDto,
  ) {
    const microJob = await this.microJobsService.review(id, jobseekerId, user.id, dto);
    return serializeMicroJob(microJob);
  }

  @Roles(Role.EMPLOYER)
  @Post(':id/applicants/:jobseekerId/upgrade')
  async upgrade(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('jobseekerId') jobseekerId: string,
    @Body() dto: UpgradeCandidateDto,
  ) {
    const microJob = await this.microJobsService.upgrade(id, jobseekerId, user.id, dto);
    return serializeMicroJob(microJob);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/moderate')
  async moderate(@Param('id') id: string, @Body() dto: ModerateDto) {
    const microJob = await this.microJobsService.moderate(id, dto.moderation);
    return serializeMicroJob(microJob);
  }
}
