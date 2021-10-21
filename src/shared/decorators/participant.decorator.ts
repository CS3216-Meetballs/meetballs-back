import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Participant } from '../../participants/participant.entity';
import { User } from '../../users/user.entity';

export const AccessUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as User | Participant;
  },
);
