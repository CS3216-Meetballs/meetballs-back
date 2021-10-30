import { AuthService } from './../auth.service';
import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

import { JwtConfigService } from '../../config/jwt.config';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/user.entity';
import { TokenPayload } from '../../shared/interface/token-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private jwtConfigService: JwtConfigService,
    private jwtService: JwtService,
  ) {
    super();
  }

  async validate(request: Request): Promise<User> {
    console.log('Validating user');
    const bearerHeader = request.headers['authorization'];
    const authType = request.headers['x-auth-type'];
    if (!bearerHeader) {
      throw new UnauthorizedException('No valid token');
    }
    const bearer = bearerHeader.split(' ');
    const jwtToken = bearer[1];
    if (authType === 'zoom') {
      return this.authService.getUserFromToken(jwtToken);
    } else {
      return this.validateLocal(jwtToken);
    }
  }

  private async validateLocal(jwtToken: string): Promise<User> {
    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify<TokenPayload>(jwtToken, {
        ignoreExpiration: false,
        secret: this.jwtConfigService.accessTokenOptions.secret,
      });
    } catch (error) {
      throw new UnauthorizedException();
    }

    const { userId, tokenType } = payload;
    const user = await this.usersService.findByUuid(userId);
    if (!user || tokenType != 'access_token') {
      throw new UnauthorizedException();
    }
    return user;
  }
}
