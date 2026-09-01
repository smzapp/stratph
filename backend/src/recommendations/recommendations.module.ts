import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recommendation } from './recommendation.entity.js';
import { User } from '../users/user.entity.js';
import { RecommendationsService } from './recommendations.service.js';
import { RecommendationsController } from './recommendations.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Recommendation, User]), NotificationsModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
