import { HttpService } from '@nestjs/axios';
import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { catchError, firstValueFrom, map, Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import {
  Injectable,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtConfigService } from '../../config/jwt.config';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/user.entity';
import { TokenPayload } from '../../shared/interface/token-payload.interface';
import { ZoomUser } from '../../shared/interface/zoom-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private usersService: UsersService,
    private jwtConfigService: JwtConfigService,
    private jwtService: JwtService,
    private httpService: HttpService,
  ) {
    super();
  }

  async validate(request: Request): Promise<User> {
    const bearerHeader = request.headers['authorization'];
    const authType = request.headers['x-auth-type'];
    if (!bearerHeader) {
      throw new UnauthorizedException('No valid token');
    }
    const bearer = bearerHeader.split(' ');
    const jwtToken = bearer[1];
    if (authType === 'zoom') {
      return this.validateZoom(jwtToken);
    } else {
      return this.validateLocal(jwtToken);
    }
  }

  private async validateZoom(jwtToken: string): Promise<User> {
    const zoomUser = await firstValueFrom(
      this.httpService
        .get(`/v2/users/me`, {
          baseURL: 'https://api.zoom.us',
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            'Content-type': 'application/json',
          },
        })
        .pipe(
          map((res) => res.data as ZoomUser),
          catchError((e) => {
            throw new UnauthorizedException(e.response.data, e.response.status);
          }),
        ),
    );

    return await this.usersService.updateZoomUser(zoomUser);
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
