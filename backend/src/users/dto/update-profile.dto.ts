import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { Availability, EducationEntry, ExperienceEntry, PortfolioLink } from '../user.entity.js';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  // employer
  @IsOptional()
  @IsString()
  @MaxLength(120)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  companyBlurb?: string;

  // jobseeker
  @IsOptional()
  @IsString()
  @MaxLength(150)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  preferredJobType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsArray()
  education?: EducationEntry[];

  @IsOptional()
  @IsArray()
  experience?: ExperienceEntry[];

  @IsOptional()
  @IsArray()
  portfolioLinks?: PortfolioLink[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsIn(['available', 'open', 'unavailable'])
  availability?: Availability;
}
