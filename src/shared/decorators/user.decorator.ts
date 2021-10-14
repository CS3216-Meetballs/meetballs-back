import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../users/user.entity';

export const Usr = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as User;
  },
);

export const ZoomToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    const bearerHeader = request.headers['authorization'];
    const bearer = bearerHeader.split(' ');
    const jwtToken = bearer[1];
    return jwtToken;
  },
);
