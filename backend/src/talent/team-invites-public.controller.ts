import { Controller, Get, Param } from '@nestjs/common';
import { TalentService } from './talent.service.js';

// Unauthenticated on purpose — the invitee hasn't registered yet, so the
// registration page needs to preview the invite (company name) before an
// account exists to attach a JWT guard to.
@Controller('team-invites')
export class TeamInvitesPublicController {
  constructor(private readonly talentService: TalentService) {}

  @Get(':token')
  getPreview(@Param('token') token: string) {
    return this.talentService.getInvitePreview(token);
  }
}
