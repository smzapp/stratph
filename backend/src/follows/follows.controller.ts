import { Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums.js';
import { FollowsService } from './follows.service.js';
import type { User } from '../users/user.entity.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Roles(Role.JOBSEEKER)
  @HttpCode(200)
  @Post('users/:id/follow')
  async follow(@CurrentUser() user: User, @Param('id') id: string) {
    await this.followsService.follow(user, id);
    return { ok: true };
  }

  @Roles(Role.JOBSEEKER)
  @HttpCode(200)
  @Delete('users/:id/follow')
  async unfollow(@CurrentUser() user: User, @Param('id') id: string) {
    await this.followsService.unfollow(user.id, id);
    return { ok: true };
  }

  @Roles(Role.JOBSEEKER)
  @Get('me/following')
  following(@CurrentUser() user: User) {
    return this.followsService.listFollowedEmployers(user.id);
  }
}
