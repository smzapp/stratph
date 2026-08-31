import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/enums.js';
import { OffersService } from './offers.service.js';
import { RespondOfferDto } from './dto/respond-offer.dto.js';
import type { User } from '../users/user.entity.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Roles(Role.JOBSEEKER)
  @Patch(':id/respond')
  respond(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: RespondOfferDto) {
    return this.offersService.respond(id, user.id, dto.decision);
  }
}
