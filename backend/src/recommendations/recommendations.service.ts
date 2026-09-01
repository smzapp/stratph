import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recommendation } from './recommendation.entity.js';
import { User } from '../users/user.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { NotificationType, Role } from '../common/enums.js';
import type { CreateRecommendationDto } from './dto/create-recommendation.dto.js';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Recommendation) private readonly recommendationsRepo: Repository<Recommendation>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(employer: User, dto: CreateRecommendationDto): Promise<Recommendation> {
    const jobseeker = await this.usersRepo.findOne({ where: { id: dto.jobseekerId } });
    if (!jobseeker || jobseeker.role !== Role.JOBSEEKER) {
      throw new BadRequestException('You can only recommend jobseeker accounts.');
    }

    const existing = await this.recommendationsRepo.findOne({
      where: { employerId: employer.id, jobseekerId: dto.jobseekerId },
    });

    const saved = await this.recommendationsRepo.save(
      existing
        ? { ...existing, message: dto.message }
        : this.recommendationsRepo.create({
            employerId: employer.id,
            jobseekerId: dto.jobseekerId,
            message: dto.message,
          }),
    );

    await this.notificationsService.notify(
      dto.jobseekerId,
      NotificationType.RECOMMENDATION_RECEIVED,
      'New recommendation received',
      `${employer.companyName || employer.name} recommended you: "${dto.message.slice(0, 120)}"`,
      '/profile',
    );

    return saved;
  }

  findForUser(jobseekerId: string): Promise<Recommendation[]> {
    return this.recommendationsRepo.find({ where: { jobseekerId }, order: { createdAt: 'DESC' } });
  }

  findAll(): Promise<Recommendation[]> {
    return this.recommendationsRepo.find({ order: { createdAt: 'DESC' } });
  }
}
