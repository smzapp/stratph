import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { UsersService } from '../users/users.service.js';
import { toSafeUser } from '../users/user.entity.js';
import type { SafeUser } from '../users/user.entity.js';
import { NotificationType, Role, UserStatus } from '../common/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { TalentService } from '../talent/talent.service.js';
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
    private readonly notificationsService: NotificationsService,
    private readonly talentService: TalentService,
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
      category: dto.category,
      yearsOfExperience: dto.yearsOfExperience,
      preferredJobType: dto.preferredJobType,
    });
    return { accessToken: this.issueToken(user.id, user.role), user: toSafeUser(user) };
  }

  async registerEmployer(dto: RegisterEmployerDto): Promise<AuthResult> {
    let teamOwnerId: string | undefined;
    let companyName = dto.companyName;
    let inheritedVerified: boolean | undefined;
    let inheritedSubscriptionPlan: string | null | undefined;
    let inheritedSubscriptionExpiresAt: Date | null | undefined;

    if (dto.inviteToken) {
      // Check the email matches before consuming the invite — otherwise a
      // typo'd email would burn a one-time invite for no reason.
      const preview = await this.talentService.getInvitePreview(dto.inviteToken);
      if (dto.email.trim().toLowerCase() !== preview.invitedEmail) {
        throw new BadRequestException('This invite was sent to a different email address.');
      }
      const consumed = await this.talentService.consumeInvite(dto.inviteToken);
      if (!consumed) throw new BadRequestException('This invite link is invalid or has expired.');
      teamOwnerId = consumed.teamOwnerId;
      // The invite locks in the inviting company's name — a teammate can't
      // register under a different company than the team they're joining.
      companyName = consumed.companyName;
      const owner = await this.usersService.findById(consumed.teamOwnerId);
      inheritedVerified = owner.verified ?? false;
      inheritedSubscriptionPlan = owner.subscriptionPlan;
      inheritedSubscriptionExpiresAt = owner.subscriptionExpiresAt;
    }

    const user = await this.usersService.createUser({
      email: dto.email,
      password: dto.password,
      role: Role.EMPLOYER,
      name: dto.name,
      companyName,
      companyBlurb: dto.companyBlurb,
      teamOwnerId,
      verified: inheritedVerified,
      subscriptionPlan: inheritedSubscriptionPlan,
      subscriptionExpiresAt: inheritedSubscriptionExpiresAt,
    });

    if (teamOwnerId) {
      await this.notificationsService.notify(
        teamOwnerId,
        NotificationType.TEAM_INVITE_ACCEPTED,
        'Your teammate joined',
        `${user.name} (${user.email}) joined your hiring team on StratPH.`,
        '/dashboard/employer/talent-pool?tab=team',
      );
    }

    if (!user.verified) {
      const admins = await this.usersService.findByRole(Role.ADMIN);
      await this.notificationsService.notifyMany(
        admins.map((a) => a.id),
        NotificationType.EMPLOYER_PENDING_VERIFICATION,
        'New employer awaiting verification',
        `${user.companyName || user.name} just registered and is not yet verified.`,
        '/dashboard/admin/users',
      );
    }

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
