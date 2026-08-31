import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './offer.entity.js';
import { ActivityEntry } from '../activity/activity.entity.js';
import { OffersService } from './offers.service.js';
import { OffersController } from './offers.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Offer, ActivityEntry])],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
