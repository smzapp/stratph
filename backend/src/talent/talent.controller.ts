import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { PipelineStage, Role } from '../common/enums.js';
import { TalentService } from './talent.service.js';
import type { User } from '../users/user.entity.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.EMPLOYER)
@Controller('talent')
export class TalentController {
  constructor(private readonly talentService: TalentService) {}

  @Get('lists')
  listLists(@CurrentUser() user: User) {
    return this.talentService.listLists(user);
  }

  @Post('lists')
  createList(@CurrentUser() user: User, @Body('name') name: string) {
    return this.talentService.createList(user, name);
  }

  @HttpCode(200)
  @Delete('lists/:id')
  async deleteList(@CurrentUser() user: User, @Param('id') id: string) {
    await this.talentService.deleteList(user, id);
    return { ok: true };
  }

  @Get('lists/:id/members')
  getListMembers(@CurrentUser() user: User, @Param('id') id: string) {
    return this.talentService.getListMembers(user, id);
  }

  @HttpCode(200)
  @Post('lists/:id/members')
  async addToList(@CurrentUser() user: User, @Param('id') id: string, @Body('jobseekerId') jobseekerId: string) {
    await this.talentService.addToList(user, id, jobseekerId);
    return { ok: true };
  }

  @HttpCode(200)
  @Delete('lists/:id/members/:jobseekerId')
  async removeFromList(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('jobseekerId') jobseekerId: string,
  ) {
    await this.talentService.removeFromList(user, id, jobseekerId);
    return { ok: true };
  }

  @Get('pipeline')
  getPipeline(@CurrentUser() user: User) {
    return this.talentService.getPipeline(user);
  }

  @HttpCode(200)
  @Patch('pipeline/:jobseekerId')
  async setStage(
    @CurrentUser() user: User,
    @Param('jobseekerId') jobseekerId: string,
    @Body('stage') stage: PipelineStage,
  ) {
    await this.talentService.setPipelineStage(user, jobseekerId, stage);
    return { ok: true };
  }

  @HttpCode(200)
  @Delete('pipeline/:jobseekerId')
  async removeFromPipeline(@CurrentUser() user: User, @Param('jobseekerId') jobseekerId: string) {
    await this.talentService.removeFromPipeline(user, jobseekerId);
    return { ok: true };
  }

  @Get('team')
  getTeam(@CurrentUser() user: User) {
    return this.talentService.getTeam(user);
  }

  @HttpCode(200)
  @Post('team/invites')
  async inviteTeammate(@CurrentUser() user: User, @Body('email') email: string) {
    await this.talentService.inviteTeammate(user, email);
    return { ok: true };
  }

  @HttpCode(200)
  @Delete('team/members/:id')
  async removeTeammate(@CurrentUser() user: User, @Param('id') id: string) {
    await this.talentService.removeTeammate(user, id);
    return { ok: true };
  }
}
