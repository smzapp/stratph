import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { UsersService } from '../users/users.service.js';
import { toSafeUser } from '../users/user.entity.js';
import type { SafeUser } from '../users/user.entity.js';
import { Role, UserStatus } from '../common/enums.js';
import { PasswordResetToken } from './password-reset-token.entity.js';
import type { RegisterJobseekerDto } from './dto/register-jobseeker.dto.js';
import type { RegisterEmployerDto } from './dto/register-employer.dto.js';

export interface AuthResult {
  accessToken: string;
  user: SafeUser;
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepo: Repository<PasswordResetToken>,
  ) {}

  private issueToken(userId: string, role: Role): string {
    return this.jwtService.sign({ sub: userId, role });
  }

  async registerJobseeker(dto: RegisterJobseekerDto): Promise<AuthResult> {
    const user = await this.usersService.createUser({
      email: dto.email,
      password: dto.password,
      role: Role.JOBSEEKER,
      name: dto.name,
      headline: dto.headline,
      location: dto.location,
      skills: dto.skills,
    });
    return { accessToken: this.issueToken(user.id, user.role), user: toSafeUser(user) };
  }

  async registerEmployer(dto: RegisterEmployerDto): Promise<AuthResult> {
    const user = await this.usersService.createUser({
      email: dto.email,
      password: dto.password,
      role: Role.EMPLOYER,
      name: dto.name,
      companyName: dto.companyName,
      companyBlurb: dto.companyBlurb,
    });
    return { accessToken: this.issueToken(user.id, user.role), user: toSafeUser(user) };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Incorrect email or password.');

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) throw new UnauthorizedException('Incorrect email or password.');

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('This account has been suspended.');
    }

    return { accessToken: this.issueToken(user.id, user.role), user: toSafeUser(user) };
  }

  async forgotPassword(email: string): Promise<{ resetToken: string; expiresAt: Date } | null> {
    const user = await this.usersService.findByEmail(email);
    // Do not reveal whether the account exists.
    if (!user) return null;

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.resetTokenRepo.save(this.resetTokenRepo.create({ userId: user.id, token, expiresAt }));
    return { resetToken: token, expiresAt };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.resetTokenRepo.findOne({ where: { token } });
    if (!record || record.used || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }
    await this.usersService.updatePassword(record.userId, newPassword);
    record.used = true;
    await this.resetTokenRepo.save(record);
  }

  async deactivate(userId: string): Promise<SafeUser> {
    const user = await this.usersService.deactivate(userId);
    return toSafeUser(user);
  }
}
