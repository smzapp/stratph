import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { UsersService } from './users.service.js';

// Unauthenticated: this is what a shared profile link resolves to.
@Controller('public/profiles')
export class PublicController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getProfile(@Param('id') id: string) {
    const profile = await this.usersService.getPublicProfile(id);
    if (!profile) throw new NotFoundException('This profile is not available.');
    await this.usersService.recordProfileView(id, null);
    return profile;
  }
}
