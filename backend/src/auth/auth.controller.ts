import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterJobseekerDto } from './dto/register-jobseeker.dto.js';
import { RegisterEmployerDto } from './dto/register-employer.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { toSafeUser } from '../users/user.entity.js';
import type { User } from '../users/user.entity.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/jobseeker')
  registerJobseeker(@Body() dto: RegisterJobseekerDto) {
    return this.authService.registerJobseeker(dto);
  }

  @Post('register/employer')
  registerEmployer(@Body() dto: RegisterEmployerDto) {
    return this.authService.registerEmployer(dto);
  }

  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @HttpCode(200)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto.email);
    // In production this would be emailed. For this demo, the token is
    // returned directly so the reset flow can be exercised end-to-end.
    return {
      message: 'If that email exists, a reset link has been generated.',
      ...(result ? { resetToken: result.resetToken, expiresAt: result.expiresAt } : {}),
    };
  }

  @HttpCode(200)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Your password has been reset. You can now log in.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: User) {
    return toSafeUser(user);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('deactivate')
  deactivate(@CurrentUser() user: User) {
    return this.authService.deactivate(user.id);
  }
}
