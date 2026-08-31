import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportReason } from '../../common/enums.js';

export class CreateReportDto {
  @IsString()
  reportedUserId!: string;

  @IsEnum(ReportReason)
  reason!: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contextLabel?: string;
}
