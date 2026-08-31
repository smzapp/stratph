import { IsEnum } from 'class-validator';
import { ModerationStatus } from '../../common/enums.js';

export class ModerateDto {
  @IsEnum(ModerationStatus)
  moderation!: ModerationStatus;
}
