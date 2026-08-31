import { IsArray, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateMicroJobDto {
  @IsString()
  title!: string;

  @IsString()
  category!: string;

  @IsString()
  description!: string;

  @IsString()
  deliverable!: string;

  @IsInt()
  @Min(300)
  @Max(3000)
  pay!: number;

  @IsString()
  estimatedTime!: string;

  @IsArray()
  @IsString({ each: true })
  skillsRequired!: string[];

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  minYearsOfExperience?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minProfileCompleteness?: number;
}
