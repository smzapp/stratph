import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity.js';
import { ProfileView } from './profile-view.entity.js';
import { Applicant } from '../micro-jobs/applicant.entity.js';
import { Offer } from '../offers/offer.entity.js';
import { ActivityEntry } from '../activity/activity.entity.js';
import { Role, UserStatus, ApplicantStatus, NotificationType, SubscriptionPlan } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

const SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CreateUserInput {
  email: string;
  password: string;
  role: Role;
  name: string;
  companyName?: string;
  companyBlurb?: string;
  headline?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  category?: string;
  yearsOfExperience?: number;
  preferredJobType?: string;
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface PublicProfile {
  id: string;
  name: string;
  headline: string | null;
  location: string | null;
  category: string | null;
  yearsOfExperience: number | null;
  preferredJobType: string | null;
  bio: string | null;
  skills: string[];
  joinedAt: Date;
  completedTrials: number;
  activity: { id: string; type: string; skill: string | null; title: string; date: Date }[];
}

export interface JobseekerAnalytics {
  profileViews: { total: number; last7Days: number; last30Days: number };
  completedTrials: number;
  offersReceived: number;
  activityCount: number;
  profileCompleteness: number;
  suggestions: string[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(ProfileView) private readonly profileViewsRepo: Repository<ProfileView>,
    @InjectRepository(Applicant) private readonly applicantsRepo: Repository<Applicant>,
    @InjectRepository(Offer) private readonly offersRepo: Repository<Offer>,
    @InjectRepository(ActivityEntry) private readonly activityRepo: Repository<ActivityEntry>,
    private readonly notificationsService: NotificationsService,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email: email.trim().toLowerCase() } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  findAll(): Promise<User[]> {
    return this.usersRepo.find({ order: { createdAt: 'DESC' } });
  }

  findByRole(role: Role): Promise<User[]> {
    return this.usersRepo.find({ where: { role } });
  }

  hasActiveSubscription(user: User): boolean {
    return !!(user.subscriptionPlan && user.subscriptionExpiresAt && user.subscriptionExpiresAt.getTime() > Date.now());
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const existing = await this.findByEmail(input.email);
    if (existing) throw new BadRequestException('An account with this email already exists.');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = this.usersRepo.create({
      email: input.email.trim().toLowerCase(),
      passwordHash,
      role: input.role,
      name: input.name,
      status: UserStatus.ACTIVE,
      companyName: input.companyName ?? null,
      companyBlurb: input.companyBlurb ?? null,
      verified: input.role === Role.EMPLOYER ? false : null,
      headline: input.headline ?? null,
      location: input.location ?? null,
      bio: input.bio ?? null,
      skills: input.role === Role.JOBSEEKER ? (input.skills ?? []) : null,
      discoverable: input.role === Role.JOBSEEKER ? true : null,
      category: input.role === Role.JOBSEEKER ? (input.category ?? null) : null,
      yearsOfExperience: input.role === Role.JOBSEEKER ? (input.yearsOfExperience ?? null) : null,
      preferredJobType: input.role === Role.JOBSEEKER ? (input.preferredJobType ?? null) : null,
    });
    return this.usersRepo.save(user);
  }

  async listPaginated(params: {
    page: number;
    limit: number;
    role?: Role;
    q?: string;
  }): Promise<PaginatedUsers> {
    const page = Math.max(1, params.page);
    const limit = Math.min(100, Math.max(1, params.limit));

    const qb = this.usersRepo.createQueryBuilder('user');
    if (params.role) qb.andWhere('user.role = :role', { role: params.role });
    if (params.q?.trim()) {
      const q = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(user.name) LIKE :q OR LOWER(user.email) LIKE :q OR LOWER(user.companyName) LIKE :q)',
        { q },
      );
    }
    qb.orderBy('user.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersRepo.update(userId, { passwordHash });
  }

  async setStatus(userId: string, status: UserStatus): Promise<User> {
    const user = await this.findById(userId);
    user.status = status;
    return this.usersRepo.save(user);
  }

  async verifyEmployer(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (user.role !== Role.EMPLOYER) {
      throw new BadRequestException('Only employer accounts can be verified.');
    }
    user.verified = true;
    const saved = await this.usersRepo.save(user);
    await this.notificationsService.notify(
      user.id,
      NotificationType.EMPLOYER_VERIFIED,
      'Your company is verified',
      `${user.companyName || user.name} is now a verified employer on StratPH.`,
      '/profile',
    );
    return saved;
  }

  async subscribe(userId: string, plan: SubscriptionPlan): Promise<User> {
    const user = await this.findById(userId);
    if (user.role !== Role.EMPLOYER) {
      throw new BadRequestException('Only employer accounts can subscribe to a plan.');
    }
    user.subscriptionPlan = plan;
    user.subscriptionExpiresAt = new Date(Date.now() + SUBSCRIPTION_DURATION_MS);
    const saved = await this.usersRepo.save(user);
    await this.notificationsService.notify(
      user.id,
      NotificationType.SUBSCRIPTION_ACTIVATED,
      `You're on the ${plan} plan`,
      `Your job postings will be auto-approved until ${saved.subscriptionExpiresAt!.toLocaleDateString('en-PH')}.`,
      '/dashboard/employer/jobs',
    );
    return saved;
  }

  async cancelSubscription(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.subscriptionPlan = null;
    user.subscriptionExpiresAt = null;
    return this.usersRepo.save(user);
  }

  async contactJobseeker(employer: User, jobseekerId: string, message: string): Promise<void> {
    if (!this.hasActiveSubscription(employer)) {
      throw new ForbiddenException('Contacting candidates requires an active subscription.');
    }
    const jobseeker = await this.findById(jobseekerId);
    if (jobseeker.role !== Role.JOBSEEKER) {
      throw new BadRequestException('You can only contact jobseeker accounts.');
    }
    await this.notificationsService.notify(
      jobseekerId,
      NotificationType.CONTACT_MESSAGE,
      `Message from ${employer.companyName || employer.name}`,
      message,
      '/profile',
    );
  }

  async adminSetSubscription(userId: string, plan: SubscriptionPlan | null): Promise<User> {
    const user = await this.findById(userId);
    if (user.role !== Role.EMPLOYER) {
      throw new BadRequestException('Only employer accounts can have a subscription.');
    }
    user.subscriptionPlan = plan;
    user.subscriptionExpiresAt = plan ? new Date(Date.now() + SUBSCRIPTION_DURATION_MS) : null;
    return this.usersRepo.save(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    if (dto.name !== undefined) user.name = dto.name;
    if (user.role === Role.EMPLOYER) {
      if (dto.companyName !== undefined) user.companyName = dto.companyName;
      if (dto.companyBlurb !== undefined) user.companyBlurb = dto.companyBlurb;
    }
    if (user.role === Role.JOBSEEKER) {
      if (dto.headline !== undefined) user.headline = dto.headline;
      if (dto.location !== undefined) user.location = dto.location;
      if (dto.bio !== undefined) user.bio = dto.bio;
      if (dto.skills !== undefined) user.skills = dto.skills;
      if (dto.category !== undefined) user.category = dto.category;
      if (dto.yearsOfExperience !== undefined) user.yearsOfExperience = dto.yearsOfExperience;
      if (dto.preferredJobType !== undefined) user.preferredJobType = dto.preferredJobType;
    }
    return this.usersRepo.save(user);
  }

  async setDiscoverable(userId: string, discoverable: boolean): Promise<User> {
    const user = await this.findById(userId);
    if (user.role !== Role.JOBSEEKER) {
      throw new BadRequestException('Only jobseeker accounts can toggle discoverability.');
    }
    user.discoverable = discoverable;
    return this.usersRepo.save(user);
  }

  async deactivate(userId: string): Promise<User> {
    return this.setStatus(userId, UserStatus.SUSPENDED);
  }

  async recordProfileView(viewedUserId: string, viewerId: string | null): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: viewedUserId } });
    if (!user || user.role !== Role.JOBSEEKER) return;
    // A jobseeker opening their own profile shouldn't inflate their own view count.
    if (viewerId && viewerId === viewedUserId) return;

    await this.profileViewsRepo.save(
      this.profileViewsRepo.create({ viewedUserId, viewerId }),
    );
    await this.usersRepo.increment({ id: viewedUserId }, 'profileViews', 1);
  }

  async getPublicProfile(userId: string): Promise<PublicProfile | null> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== Role.JOBSEEKER) return null;

    const [completedTrials, activity] = await Promise.all([
      this.applicantsRepo.count({
        where: [
          { jobseekerId: userId, status: ApplicantStatus.APPROVED },
          { jobseekerId: userId, status: ApplicantStatus.UPGRADED },
        ],
      }),
      this.activityRepo.find({ where: { jobseekerId: userId }, order: { date: 'DESC' }, take: 20 }),
    ]);

    return {
      id: user.id,
      name: user.name,
      headline: user.headline,
      location: user.location,
      category: user.category,
      yearsOfExperience: user.yearsOfExperience,
      preferredJobType: user.preferredJobType,
      bio: user.bio,
      skills: user.skills ?? [],
      joinedAt: user.createdAt,
      completedTrials,
      activity: activity.map((a) => ({
        id: a.id,
        type: a.type,
        skill: a.skill,
        title: a.title,
        date: a.date,
      })),
    };
  }

  computeProfileCompleteness(user: User): number {
    const fields = [
      user.headline,
      user.bio,
      user.location,
      user.category,
      user.preferredJobType,
      user.yearsOfExperience !== null && user.yearsOfExperience !== undefined,
      (user.skills?.length ?? 0) >= 3,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }

  async getAnalytics(userId: string): Promise<JobseekerAnalytics> {
    const user = await this.findById(userId);
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [totalViews, last7Days, last30Days, completedTrials, offersReceived, activityCount] =
      await Promise.all([
        this.profileViewsRepo.count({ where: { viewedUserId: userId } }),
        this.profileViewsRepo.count({
          where: { viewedUserId: userId, createdAt: MoreThanOrEqual(sevenDaysAgo) },
        }),
        this.profileViewsRepo.count({
          where: { viewedUserId: userId, createdAt: MoreThanOrEqual(thirtyDaysAgo) },
        }),
        this.applicantsRepo.count({
          where: [
            { jobseekerId: userId, status: ApplicantStatus.APPROVED },
            { jobseekerId: userId, status: ApplicantStatus.UPGRADED },
          ],
        }),
        this.offersRepo.count({ where: { jobseekerId: userId } }),
        this.activityRepo.count({ where: { jobseekerId: userId } }),
      ]);

    const profileCompleteness = this.computeProfileCompleteness(user);

    const suggestions: string[] = [];
    if (!user.headline) suggestions.push('Add a headline so employers instantly know what you do.');
    if (!user.bio) suggestions.push('Write a short bio — profiles with a bio get more views.');
    if ((user.skills?.length ?? 0) < 3) {
      suggestions.push('Add at least 3 skills to show up in more employer searches.');
    }
    if (user.yearsOfExperience === null || user.yearsOfExperience === undefined) {
      suggestions.push('Add your years of experience — employers can filter by this.');
    }
    if (!user.preferredJobType) {
      suggestions.push('Set your preferred job type so employers can filter for you.');
    }
    if (!user.category) {
      suggestions.push('Choose a category so you appear in category search.');
    }
    if (!user.discoverable) {
      suggestions.push("Turn on discoverability in My Activity — you're currently hidden from employer search.");
    }
    if (completedTrials === 0) {
      suggestions.push('Complete a Trial Task to build a verified track record — completed trials get far more views.');
    }
    if (totalViews === 0) {
      suggestions.push('Share your profile link with potential clients to start getting views.');
    }

    return {
      profileViews: { total: totalViews, last7Days, last30Days },
      completedTrials,
      offersReceived,
      activityCount,
      profileCompleteness,
      suggestions,
    };
  }
}
