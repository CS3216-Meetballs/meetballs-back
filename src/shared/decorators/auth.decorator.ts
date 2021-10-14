import { JwtAuthGuard } from './../../auth/guard/jwt-auth.guard';
import { applyDecorators, CanActivate, Type, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { IAuthGuard } from '@nestjs/passport';

export function UseAuth(...guards: (Type<CanActivate> | Type<IAuthGuard>)[]) {
  return applyDecorators(
    UseGuards(...guards),
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
