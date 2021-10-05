import { JwtAuthGuard } from './../../auth/guard/jwt-auth.guard';
import { applyDecorators, Type, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { IAuthGuard } from '@nestjs/passport';

export function UseAuth(guard: Type<IAuthGuard>) {
  return applyDecorators(
    UseGuards(guard),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}

export function UseBearerAuth() {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
