import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { TokenPayload } from '../interface/token-payload.interface';
import { JwtConfigService } from '../../config/jwt.config';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private jwtConfigService: JwtConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfigService.accessTokenOptions.secret,
    });
  }

  async validate(payload: TokenPayload): Promise<User> {
    const { userId, type } = payload;
    const user = await this.usersService.findByUuid(userId);

    if (!user || type != 'access') {
      throw new UnauthorizedException();
    }
    return user;
  }
}
