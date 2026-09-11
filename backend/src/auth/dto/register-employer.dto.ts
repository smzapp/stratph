import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterEmployerDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  companyName!: string;

  @IsOptional()
  @IsString()
  companyBlurb?: string;

  @IsOptional()
  @IsString()
  inviteToken?: string;
}
