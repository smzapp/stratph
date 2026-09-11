import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TalentList } from './talent-list.entity.js';
import { TalentListMember } from './talent-list-member.entity.js';
import { CandidatePipelineEntry } from './candidate-pipeline-entry.entity.js';
import { TeamInvite } from './team-invite.entity.js';
import { TalentService } from './talent.service.js';
import { TalentController } from './talent.controller.js';
import { TeamInvitesPublicController } from './team-invites-public.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([TalentList, TalentListMember, CandidatePipelineEntry, TeamInvite]),
    UsersModule,
  ],
  controllers: [TalentController, TeamInvitesPublicController],
  providers: [TalentService],
  exports: [TalentService],
})
export class TalentModule {}
