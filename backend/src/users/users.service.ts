import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity.js';
import { Role, UserStatus } from '../common/enums.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

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
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly usersRepo: Repository<User>) {}

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
}
