import { IsEnum } from 'class-validator';
import { SubscriptionPlan } from '../../common/enums.js';

export class SubscribeDto {
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;
}
