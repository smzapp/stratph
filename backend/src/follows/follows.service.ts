import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './follow.entity.js';
import { UsersService } from '../users/users.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { NotificationType, Role } from '../common/enums.js';
import type { User } from '../users/user.entity.js';

export interface FollowedEmployerSummary {
  id: string;
  name: string;
  companyName: string | null;
  verified: boolean | null;
  followedAt: Date;
}

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow) private readonly followsRepo: Repository<Follow>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async isFollowing(jobseekerId: string, employerId: string): Promise<boolean> {
    const existing = await this.followsRepo.findOne({ where: { jobseekerId, employerId } });
    return !!existing;
  }

  async follow(jobseeker: User, employerId: string): Promise<void> {
    if (jobseeker.role !== Role.JOBSEEKER) {
      throw new BadRequestException('Only jobseeker accounts can follow employers.');
    }
    const employer = await this.usersService.findById(employerId);
    if (employer.role !== Role.EMPLOYER) {
      throw new BadRequestException('You can only follow employer accounts.');
    }
    const existing = await this.followsRepo.findOne({
      where: { jobseekerId: jobseeker.id, employerId },
    });
    if (existing) return;
    await this.followsRepo.save(this.followsRepo.create({ jobseekerId: jobseeker.id, employerId }));
  }

  async unfollow(jobseekerId: string, employerId: string): Promise<void> {
    await this.followsRepo.delete({ jobseekerId, employerId });
  }

  async listFollowedEmployers(jobseekerId: string): Promise<FollowedEmployerSummary[]> {
    const rows = await this.followsRepo.find({ where: { jobseekerId }, order: { createdAt: 'DESC' } });
    const employers = await Promise.all(rows.map((r) => this.usersService.findById(r.employerId).catch(() => null)));
    return rows
      .map((r, i) => {
        const e = employers[i];
        if (!e) return null;
        return { id: e.id, name: e.name, companyName: e.companyName, verified: e.verified, followedAt: r.createdAt };
      })
      .filter((x): x is FollowedEmployerSummary => x !== null);
  }

  private async listFollowerIds(employerId: string): Promise<string[]> {
    const rows = await this.followsRepo.find({ where: { employerId } });
    return rows.map((r) => r.jobseekerId);
  }

  // Called when an employer's new Trial Task/Job goes live, so followers hear
  // about it without needing to keep checking that employer's postings.
  async notifyFollowersOfNewOpportunity(employerId: string, details: { title: string; link: string }): Promise<void> {
    const followerIds = await this.listFollowerIds(employerId);
    if (followerIds.length === 0) return;
    const employer = await this.usersService.findById(employerId);
    await this.notificationsService.notifyMany(
      followerIds,
      NotificationType.NEW_TASK_FROM_FOLLOWED_EMPLOYER,
      `${employer.companyName || employer.name} posted something new`,
      details.title,
      details.link,
    );
  }
}
