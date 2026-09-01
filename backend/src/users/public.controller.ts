import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { RecommendationsService } from '../recommendations/recommendations.service.js';
import { computeBadges } from './badges.js';

// Unauthenticated: this is what a shared profile link resolves to.
@Controller('public/profiles')
export class PublicController {
  constructor(
    private readonly usersService: UsersService,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get(':id')
  async getProfile(@Param('id') id: string) {
    const profile = await this.usersService.getPublicProfile(id);
    if (!profile) throw new NotFoundException('This profile is not available.');

    const recommendations = await this.recommendationsService.findForUser(id);
    const employerIds = [...new Set(recommendations.map((r) => r.employerId))];
    const employers = await Promise.all(employerIds.map((eid) => this.usersService.findById(eid).catch(() => null)));
    const employerById = new Map(employers.filter((e) => e !== null).map((e) => [e.id, e]));

    await this.usersService.recordProfileView(id, null);

    const badges = computeBadges({
      completedTrials: profile.completedTrials,
      recommendationsCount: recommendations.length,
      certificationsCount: profile.certifications.length,
      profileCompleteness: profile.profileCompleteness,
    });

    return {
      ...profile,
      badges,
      recommendations: recommendations.map((r) => {
        const employer = employerById.get(r.employerId);
        return {
          id: r.id,
          employerName: employer?.companyName || employer?.name || 'A verified employer',
          message: r.message,
          createdAt: r.createdAt,
        };
      }),
    };
  }
}
