import { IsEnum, IsOptional } from 'class-validator';
import { SubscriptionPlan } from '../../common/enums.js';

export class AdminSetSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  plan?: SubscriptionPlan | null;
}
