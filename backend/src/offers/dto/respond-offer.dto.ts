import { IsEnum } from 'class-validator';
import { OfferStatus } from '../../common/enums.js';

export class RespondOfferDto {
  @IsEnum(OfferStatus)
  decision!: OfferStatus.ACCEPTED | OfferStatus.DECLINED;
}
