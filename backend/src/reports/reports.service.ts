import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './report.entity.js';
import { UsersService } from '../users/users.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { NotificationType, ReportStatus, Role } from '../common/enums.js';
import type { CreateReportDto } from './dto/create-report.dto.js';
import type { User } from '../users/user.entity.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private readonly reportsRepo: Repository<Report>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(reporter: User, dto: CreateReportDto): Promise<Report> {
    const reportedUser = await this.usersService.findById(dto.reportedUserId);
    if (reportedUser.role !== Role.EMPLOYER) {
      throw new BadRequestException('You can only report employer accounts.');
    }

    const report = await this.reportsRepo.save(
      this.reportsRepo.create({
        reporterId: reporter.id,
        reportedUserId: dto.reportedUserId,
        reason: dto.reason,
        details: dto.details ?? null,
        contextLabel: dto.contextLabel ?? null,
      }),
    );

    const admins = await this.usersService.findByRole(Role.ADMIN);
    await this.notificationsService.notifyMany(
      admins.map((a) => a.id),
      NotificationType.EMPLOYER_REPORTED,
      'New employer report',
      `${reporter.name} reported ${reportedUser.companyName || reportedUser.name}.`,
      '/dashboard/admin/reports',
    );

    return report;
  }

  findAll(): Promise<Report[]> {
    return this.reportsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async resolve(id: string): Promise<Report> {
    await this.reportsRepo.update(id, { status: ReportStatus.RESOLVED });
    return this.reportsRepo.findOneOrFail({ where: { id } });
  }
}
