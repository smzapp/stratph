import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity.js';
import type { CreateJobDto } from './dto/create-job.dto.js';

@Injectable()
export class JobsService {
  constructor(@InjectRepository(Job) private readonly jobsRepo: Repository<Job>) {}

  findAll(): Promise<Job[]> {
    return this.jobsRepo.find({ order: { postedAt: 'DESC' } });
  }

  async create(employerId: string, dto: CreateJobDto): Promise<Job> {
    const job = this.jobsRepo.create({ ...dto, employerId, status: 'open', applicants: 0 });
    return this.jobsRepo.save(job);
  }
}
