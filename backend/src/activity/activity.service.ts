import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityEntry } from './activity.entity.js';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityEntry) private readonly activityRepo: Repository<ActivityEntry>,
  ) {}

  findAll(): Promise<ActivityEntry[]> {
    return this.activityRepo.find({ order: { date: 'DESC' } });
  }
}
