import { Module } from '@nestjs/common';
import { JobAlertsService } from './job-alerts.service.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule],
  providers: [JobAlertsService],
  exports: [JobAlertsService],
})
export class JobAlertsModule {}
