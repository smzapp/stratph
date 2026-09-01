import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRecommendationDto {
  @IsString()
  jobseekerId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message!: string;
}
