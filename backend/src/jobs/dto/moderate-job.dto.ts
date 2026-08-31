import { IsEnum } from 'class-validator';
import { ModerationStatus } from '../../common/enums.js';

export class ModerateJobDto {
  @IsEnum(ModerationStatus)
  moderation!: ModerationStatus;
}
