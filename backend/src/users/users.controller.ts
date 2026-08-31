import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
}
