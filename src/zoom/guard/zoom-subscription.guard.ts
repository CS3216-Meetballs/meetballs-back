import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

import { ZoomConfigService } from '../../config/zoom.config';

@Injectable()
export class ZoomSubscriptionGuard implements CanActivate {
  constructor(private zoomConfig: ZoomConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = request.headers['authorization'];
    return this.zoomConfig.verificationToken === token;
  }
}
