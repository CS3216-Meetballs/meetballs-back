import { ParticipantStrategy } from './strategies/participant.strategy';
import { Participant } from 'src/participants/participant.entity';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

import { AppConfigModule } from '../config/config.module';

import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Participant]),
    UsersModule,
    PassportModule,
    JwtModule.register({}),
    AppConfigModule,
    MailModule,
    HttpModule.register({
      baseURL: 'https://zoom.us/',
      timeout: 5000,
      maxRedirects: 5,
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
      },
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    ParticipantStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
