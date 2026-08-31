import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums.js';
import { JobsService } from './jobs.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { ModerateJobDto } from './dto/moderate-job.dto.js';
import type { User } from '../users/user.entity.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Roles(Role.EMPLOYER)
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateJobDto) {
    return this.jobsService.create(user.id, dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/moderate')
  moderate(@Param('id') id: string, @Body() dto: ModerateJobDto) {
    return this.jobsService.moderate(id, dto.moderation);
  }
}
