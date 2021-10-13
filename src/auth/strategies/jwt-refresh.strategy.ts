import { Request } from 'express';
import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../../users/users.service';
import { JwtConfigService } from '../../config/jwt.config';
import {
  TokenPayload,
  ZoomTokenPayload,
} from '../../shared/interface/token-payload.interface';
import { User } from '../../users/user.entity';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private usersService: UsersService,
    private jwtConfigService: JwtConfigService,
    private jwtService: JwtService,
  ) {
    super();
  }

  async validate(request: Request): Promise<User> {
    const refreshToken = request.query['refresh_token'] as string;
    const payload = this.jwtService.decode(refreshToken, { json: true }) as
      | TokenPayload
      | ZoomTokenPayload;

    const { userId, tokenType } = payload;

    let user: User;
    if (payload['authType'] === 'email') {
      await this.validateJwt(refreshToken);
      user = await this.usersService.findByZoomId(userId);
    } else {
      user = await this.usersService.findByUuid(userId);
      const isTokenMatch = await bcrypt.compare(
        refreshToken,
        user?.refreshTokenHash || '',
      );

      if (!isTokenMatch) {
        throw new UnauthorizedException();
      }
    }

    if (!user || tokenType !== 'refresh_token') {
      throw new UnauthorizedException();
    }

    return user;
  }

  private async validateJwt(jwtToken: string) {
    try {
      this.jwtService.verify<TokenPayload>(jwtToken, {
        ignoreExpiration: false,
        secret: this.jwtConfigService.refreshTokenOptions.secret,
      });
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
