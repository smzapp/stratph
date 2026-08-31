import { IsEnum } from 'class-validator';
import { UserStatus } from '../../common/enums.js';

export class UpdateStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}
