import { randomUUID } from 'node:crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TalentList } from './talent-list.entity.js';
import { TalentListMember } from './talent-list-member.entity.js';
import { CandidatePipelineEntry } from './candidate-pipeline-entry.entity.js';
import { TeamInvite } from './team-invite.entity.js';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import { PipelineStage, Role } from '../common/enums.js';
import type { User } from '../users/user.entity.js';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface TalentListSummary {
  id: string;
  name: string;
  createdAt: Date;
  memberCount: number;
}

export interface TalentListMemberSummary {
  jobseekerId: string;
  name: string;
  headline: string | null;
  addedAt: Date;
}

export interface PipelineEntrySummary {
  jobseekerId: string;
  name: string;
  headline: string | null;
  stage: PipelineStage;
  updatedAt: Date;
}

export interface TeamMemberSummary {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
}

export interface PendingInviteSummary {
  id: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface ConsumedInvite {
  teamOwnerId: string;
  companyName: string;
  invitedEmail: string;
}

@Injectable()
export class TalentService {
  constructor(
    @InjectRepository(TalentList) private readonly listsRepo: Repository<TalentList>,
    @InjectRepository(TalentListMember) private readonly membersRepo: Repository<TalentListMember>,
    @InjectRepository(CandidatePipelineEntry) private readonly pipelineRepo: Repository<CandidatePipelineEntry>,
    @InjectRepository(TeamInvite) private readonly invitesRepo: Repository<TeamInvite>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  private teamScope(user: User): string {
    return user.teamOwnerId ?? user.id;
  }

  private assertEmployer(user: User): void {
    if (user.role !== Role.EMPLOYER) {
      throw new ForbiddenException('Only employer accounts can use the Talent Pool.');
    }
  }

  // --- Lists ---

  async createList(user: User, name: string): Promise<TalentListSummary> {
    this.assertEmployer(user);
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('List name is required.');
    const saved = await this.listsRepo.save(
      this.listsRepo.create({ ownerTeamId: this.teamScope(user), name: trimmed, createdBy: user.id }),
    );
    return { id: saved.id, name: saved.name, createdAt: saved.createdAt, memberCount: 0 };
  }

  async listLists(user: User): Promise<TalentListSummary[]> {
    this.assertEmployer(user);
    const scope = this.teamScope(user);
    const lists = await this.listsRepo.find({ where: { ownerTeamId: scope }, order: { createdAt: 'DESC' } });
    const counts = await Promise.all(lists.map((l) => this.membersRepo.count({ where: { listId: l.id } })));
    return lists.map((l, i) => ({ id: l.id, name: l.name, createdAt: l.createdAt, memberCount: counts[i] }));
  }

  private async findListOrFail(user: User, listId: string): Promise<TalentList> {
    const list = await this.listsRepo.findOne({ where: { id: listId } });
    if (!list || list.ownerTeamId !== this.teamScope(user)) throw new NotFoundException('List not found.');
    return list;
  }

  async deleteList(user: User, listId: string): Promise<void> {
    this.assertEmployer(user);
    await this.findListOrFail(user, listId);
    await this.membersRepo.delete({ listId });
    await this.listsRepo.delete({ id: listId });
  }

  async addToList(user: User, listId: string, jobseekerId: string): Promise<void> {
    this.assertEmployer(user);
    await this.findListOrFail(user, listId);
    const jobseeker = await this.usersService.findById(jobseekerId);
    if (jobseeker.role !== Role.JOBSEEKER) throw new BadRequestException('Only jobseekers can be added to a list.');
    const existing = await this.membersRepo.findOne({ where: { listId, jobseekerId } });
    if (existing) return;
    await this.membersRepo.save(this.membersRepo.create({ listId, jobseekerId, addedBy: user.id }));
  }

  async removeFromList(user: User, listId: string, jobseekerId: string): Promise<void> {
    this.assertEmployer(user);
    await this.findListOrFail(user, listId);
    await this.membersRepo.delete({ listId, jobseekerId });
  }

  async getListMembers(user: User, listId: string): Promise<TalentListMemberSummary[]> {
    this.assertEmployer(user);
    await this.findListOrFail(user, listId);
    const members = await this.membersRepo.find({ where: { listId }, order: { addedAt: 'DESC' } });
    const users = await Promise.all(members.map((m) => this.usersService.findById(m.jobseekerId).catch(() => null)));
    return members
      .map((m, i) => {
        const u = users[i];
        if (!u) return null;
        return { jobseekerId: u.id, name: u.name, headline: u.headline, addedAt: m.addedAt };
      })
      .filter((x): x is TalentListMemberSummary => x !== null);
  }

  // --- Pipeline ---

  async setPipelineStage(user: User, jobseekerId: string, stage: PipelineStage): Promise<void> {
    this.assertEmployer(user);
    if (!Object.values(PipelineStage).includes(stage)) {
      throw new BadRequestException('Invalid pipeline stage.');
    }
    const jobseeker = await this.usersService.findById(jobseekerId);
    if (jobseeker.role !== Role.JOBSEEKER) {
      throw new BadRequestException('Only jobseekers can be tracked in the pipeline.');
    }
    const scope = this.teamScope(user);
    const existing = await this.pipelineRepo.findOne({ where: { ownerTeamId: scope, jobseekerId } });
    if (existing) {
      existing.stage = stage;
      existing.updatedBy = user.id;
      await this.pipelineRepo.save(existing);
    } else {
      await this.pipelineRepo.save(
        this.pipelineRepo.create({ ownerTeamId: scope, jobseekerId, stage, updatedBy: user.id }),
      );
    }
  }

  async removeFromPipeline(user: User, jobseekerId: string): Promise<void> {
    this.assertEmployer(user);
    await this.pipelineRepo.delete({ ownerTeamId: this.teamScope(user), jobseekerId });
  }

  async getPipeline(user: User): Promise<PipelineEntrySummary[]> {
    this.assertEmployer(user);
    const entries = await this.pipelineRepo.find({
      where: { ownerTeamId: this.teamScope(user) },
      order: { updatedAt: 'DESC' },
    });
    const users = await Promise.all(entries.map((e) => this.usersService.findById(e.jobseekerId).catch(() => null)));
    return entries
      .map((e, i) => {
        const u = users[i];
        if (!u) return null;
        return { jobseekerId: u.id, name: u.name, headline: u.headline, stage: e.stage, updatedAt: e.updatedAt };
      })
      .filter((x): x is PipelineEntrySummary => x !== null);
  }

  // --- Team ---

  async getTeam(user: User): Promise<{ members: TeamMemberSummary[]; pendingInvites: PendingInviteSummary[] }> {
    this.assertEmployer(user);
    const scope = this.teamScope(user);
    const [owner, teammates, pending] = await Promise.all([
      this.usersService.findById(scope),
      this.usersService.findTeamMembers(scope),
      this.invitesRepo.find({ where: { teamOwnerId: scope, acceptedAt: IsNull() }, order: { createdAt: 'DESC' } }),
    ]);
    const members: TeamMemberSummary[] = [
      { id: owner.id, name: owner.name, email: owner.email, isOwner: true },
      ...teammates.map((t) => ({ id: t.id, name: t.name, email: t.email, isOwner: false })),
    ];
    const pendingInvites = pending
      .filter((p) => p.expiresAt.getTime() > Date.now())
      .map((p) => ({ id: p.id, email: p.invitedEmail, createdAt: p.createdAt, expiresAt: p.expiresAt }));
    return { members, pendingInvites };
  }

  async inviteTeammate(user: User, email: string): Promise<void> {
    this.assertEmployer(user);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new BadRequestException('Email is required.');

    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new BadRequestException(
        "That email already has a StratPH account. Inviting an existing account into a team isn't " +
          'supported yet — ask them to register fresh with your invite link instead.',
      );
    }

    const scope = this.teamScope(user);
    const owner = await this.usersService.findById(scope);
    const token = randomUUID();
    await this.invitesRepo.save(
      this.invitesRepo.create({
        teamOwnerId: scope,
        invitedEmail: normalizedEmail,
        companyName: owner.companyName || owner.name,
        token,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      }),
    );

    const origin = this.config.get<string>('FRONTEND_ORIGIN', 'http://localhost:3000');
    const link = `${origin}/register/employer?invite=${token}`;
    await this.mailService.send({
      to: normalizedEmail,
      subject: `You're invited to join ${owner.companyName || owner.name} on StratPH`,
      html: `
        <p>${user.name} invited you to join <strong>${owner.companyName || owner.name}</strong>'s hiring team on StratPH.</p>
        <p>You'll share the same Talent Pool lists and candidate pipeline as the rest of the team.</p>
        <p><a href="${link}">Accept invite &amp; create your account →</a></p>
        <p style="color:#999;font-size:12px;">This link expires in 7 days.</p>
      `,
    });
  }

  async removeTeammate(user: User, teammateId: string): Promise<void> {
    this.assertEmployer(user);
    const scope = this.teamScope(user);
    if (scope !== user.id) throw new ForbiddenException('Only the team owner can remove teammates.');
    const teammate = await this.usersService.findById(teammateId);
    if (teammate.teamOwnerId !== scope) throw new BadRequestException('That user is not part of your team.');
    await this.usersService.setTeamOwner(teammateId, null);
  }

  async getInvitePreview(token: string): Promise<{ companyName: string; invitedEmail: string }> {
    const invite = await this.invitesRepo.findOne({ where: { token } });
    if (!invite || invite.acceptedAt || invite.expiresAt.getTime() < Date.now()) {
      throw new NotFoundException('This invite link is invalid or has expired.');
    }
    return { companyName: invite.companyName, invitedEmail: invite.invitedEmail };
  }

  async consumeInvite(token: string): Promise<ConsumedInvite | null> {
    const invite = await this.invitesRepo.findOne({ where: { token } });
    if (!invite || invite.acceptedAt || invite.expiresAt.getTime() < Date.now()) return null;
    invite.acceptedAt = new Date();
    await this.invitesRepo.save(invite);
    return { teamOwnerId: invite.teamOwnerId, companyName: invite.companyName, invitedEmail: invite.invitedEmail };
  }
}
