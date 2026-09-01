import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums.js';
import { RecommendationsService } from './recommendations.service.js';
import { CreateRecommendationDto } from './dto/create-recommendation.dto.js';
import type { User } from '../users/user.entity.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Roles(Role.EMPLOYER)
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateRecommendationDto) {
    return this.recommendationsService.create(user, dto);
  }
}
