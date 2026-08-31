import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums.js';
import { ReportsService } from './reports.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import type { User } from '../users/user.entity.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(Role.JOBSEEKER)
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateReportDto) {
    return this.reportsService.create(user, dto);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @Roles(Role.ADMIN)
  @HttpCode(200)
  @Patch(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.reportsService.resolve(id);
  }
}
