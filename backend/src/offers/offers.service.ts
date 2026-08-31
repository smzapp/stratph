import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './offer.entity.js';
import { ActivityEntry } from '../activity/activity.entity.js';
import { ActivityType, OfferStatus } from '../common/enums.js';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer) private readonly offersRepo: Repository<Offer>,
    @InjectRepository(ActivityEntry) private readonly activityRepo: Repository<ActivityEntry>,
  ) {}

  findAll(): Promise<Offer[]> {
    return this.offersRepo.find({ order: { createdAt: 'DESC' } });
  }

  async respond(offerId: string, jobseekerId: string, decision: OfferStatus): Promise<Offer> {
    const offer = await this.offersRepo.findOne({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found.');
    if (offer.jobseekerId !== jobseekerId) {
      throw new ForbiddenException('This offer does not belong to you.');
    }

    offer.status = decision;
    await this.offersRepo.save(offer);

    if (decision === OfferStatus.ACCEPTED) {
      await this.activityRepo.save(
        this.activityRepo.create({
          jobseekerId,
          type: ActivityType.UPGRADED,
          skill: null,
          title: `Accepted ${offer.offerType} offer`,
        }),
      );
    }

    return offer;
  }
}
