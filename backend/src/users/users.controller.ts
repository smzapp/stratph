import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums.js';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { SubscribeDto } from './dto/subscribe.dto.js';
import { AdminSetSubscriptionDto } from './dto/admin-set-subscription.dto.js';
import { ContactUserDto } from './dto/contact-user.dto.js';
import { toSafeUser } from './user.entity.js';
import type { User } from './user.entity.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @Get('users')
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: Role,
    @Query('q') q?: string,
  ) {
    const result = await this.usersService.listPaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      role: role || undefined,
      q,
    });
    return { ...result, data: result.data.map(toSafeUser) };
  }

  @Patch('me/profile')
  async updateMyProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return toSafeUser(updated);
  }

  @Patch('me/discoverable')
  async setMyDiscoverable(@CurrentUser() user: User, @Body('discoverable') discoverable: boolean) {
    const updated = await this.usersService.setDiscoverable(user.id, !!discoverable);
    return toSafeUser(updated);
  }

  @Roles(Role.JOBSEEKER)
  @Get('me/analytics')
  getMyAnalytics(@CurrentUser() user: User) {
    return this.usersService.getAnalytics(user.id);
  }

  @HttpCode(200)
  @Post('users/:id/view')
  async recordView(@CurrentUser() user: User, @Param('id') id: string) {
    await this.usersService.recordProfileView(id, user.id);
    return { ok: true };
  }

  @Roles(Role.ADMIN)
  @Patch('users/:id/status')
  async setStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    const updated = await this.usersService.setStatus(id, dto.status);
    return toSafeUser(updated);
  }

  @Roles(Role.ADMIN)
  @Patch('users/:id/verify')
  async verify(@Param('id') id: string) {
    const updated = await this.usersService.verifyEmployer(id);
    return toSafeUser(updated);
  }

  @Roles(Role.EMPLOYER)
  @Post('me/subscribe')
  async subscribe(@CurrentUser() user: User, @Body() dto: SubscribeDto) {
    const updated = await this.usersService.subscribe(user.id, dto.plan);
    return toSafeUser(updated);
  }

  @Roles(Role.EMPLOYER)
  @HttpCode(200)
  @Post('me/cancel-subscription')
  async cancelSubscription(@CurrentUser() user: User) {
    const updated = await this.usersService.cancelSubscription(user.id);
    return toSafeUser(updated);
  }

  @Roles(Role.ADMIN)
  @Patch('users/:id/subscription')
  async adminSetSubscription(@Param('id') id: string, @Body() dto: AdminSetSubscriptionDto) {
    const updated = await this.usersService.adminSetSubscription(id, dto.plan ?? null);
    return toSafeUser(updated);
  }

  @Roles(Role.EMPLOYER)
  @HttpCode(200)
  @Post('users/:id/contact')
  async contact(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: ContactUserDto) {
    await this.usersService.contactJobseeker(user, id, dto.message);
    return { ok: true };
  }
}
