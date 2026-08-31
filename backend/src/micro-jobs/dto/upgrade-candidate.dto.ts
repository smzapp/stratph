import { IsString } from 'class-validator';

export class UpgradeCandidateDto {
  @IsString()
  offerType!: string;

  @IsString()
  message!: string;
}
