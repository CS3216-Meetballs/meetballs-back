import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../../users/users.service';
import { JwtConfigService } from '../../config/jwt.config';
import { TokenPayload } from '../interface/token-payload.interface';
import { User } from '../../users/user.entity';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private usersService: UsersService,
    private jwtConfigService: JwtConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter('refresh_token'),
      ignoreExpiration: false,
      secretOrKey: jwtConfigService.refreshTokenOptions.secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: TokenPayload): Promise<User> {
    const { userId, type } = payload;
    const refreshToken = req.query?.refresh_token as string;
    const user = await this.usersService.findByUuid(userId);

    const isTokenMatch = await bcrypt.compare(
      refreshToken,
      user?.refreshTokenHash || '',
    );

    if (!isTokenMatch || type != 'refresh') {
      throw new UnauthorizedException();
    }

    return user;
  }
}
