import { Request } from 'express';
import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../../users/users.service';
import { JwtConfigService } from '../../config/jwt.config';
import { TokenPayload } from '../../shared/interface/token-payload.interface';
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
    console.log('Validating user');
    const refreshToken = request.query['refresh_token'] as string;
    const payload = await this.validateJwt(refreshToken);

    const { userId, tokenType } = payload;

    const user = await this.usersService.findByUuid(userId);
    const isTokenMatch = await bcrypt.compare(
      refreshToken,
      user?.refreshTokenHash || '',
    );

    if (!user || tokenType !== 'refresh_token' || !isTokenMatch) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private async validateJwt(jwtToken: string): Promise<TokenPayload> {
    try {
      return this.jwtService.verify<TokenPayload>(jwtToken, {
        ignoreExpiration: false,
        secret: this.jwtConfigService.refreshTokenOptions.secret,
      });
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
