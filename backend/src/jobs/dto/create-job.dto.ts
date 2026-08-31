import { IsArray, IsString } from 'class-validator';

export class CreateJobDto {
  @IsString()
  title!: string;

  @IsString()
  type!: string;

  @IsString()
  location!: string;

  @IsString()
  salaryRange!: string;

  @IsArray()
  @IsString({ each: true })
  skillsRequired!: string[];
}
