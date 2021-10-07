import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

import { AppConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/app.config';
import { JwtConfigService } from '../config/jwt.config';

import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}),
    AppConfigModule,
    MailModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtConfigService,
    AppConfigService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
