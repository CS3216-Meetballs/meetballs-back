import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

export const AuthBearerToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    const bearerHeader = request.headers['authorization'];
    const bearer = bearerHeader.split(' ');
    if (!bearerHeader || bearer.length < 2) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const jwtToken = bearer[1];
    return jwtToken;
  },
);

export const AuthToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    const token = request.headers['authorization'];
    return token;
  },
);
