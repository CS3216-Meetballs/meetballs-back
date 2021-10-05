import { AppConfigModule } from 'src/config/config.module';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { AppConfigService } from 'src/config/app.config';
import { UsersModule } from 'src/users/users.module';
import { JwtConfigService } from 'src/config/jwt.config';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}),
    AppConfigModule,
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
})
export class AuthModule {}
