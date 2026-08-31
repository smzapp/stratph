import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityEntry } from './activity.entity.js';
import { ActivityService } from './activity.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityEntry])],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
