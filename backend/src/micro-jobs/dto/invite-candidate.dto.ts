import { IsString } from 'class-validator';

export class InviteCandidateDto {
  @IsString()
  jobseekerId!: string;
}
