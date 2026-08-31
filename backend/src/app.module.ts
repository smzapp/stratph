import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { MicroJobsModule } from './micro-jobs/micro-jobs.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { OffersModule } from './offers/offers.module.js';
import { ActivityModule } from './activity/activity.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { BootstrapModule } from './bootstrap/bootstrap.module.js';
import { SeedModule } from './seed/seed.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'better-sqlite3',
        database: process.env.DATABASE_PATH ?? 'stratph.sqlite',
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    MicroJobsModule,
    JobsModule,
    OffersModule,
    ActivityModule,
    PaymentsModule,
    SettingsModule,
    BootstrapModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
