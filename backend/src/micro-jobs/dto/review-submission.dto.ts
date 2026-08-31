import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicantStatus } from '../../common/enums.js';

export class ReviewSubmissionDto {
  @IsEnum(ApplicantStatus)
  decision!: ApplicantStatus.APPROVED | ApplicantStatus.REJECTED;

  @IsOptional()
  @IsString()
  feedback?: string;
}
