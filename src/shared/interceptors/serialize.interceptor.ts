import { ParticipantRole } from 'src/shared/enum/participant-role.enum';
import {
  Injectable,
  ExecutionContext,
  CallHandler,
  ClassSerializerInterceptor,
  PlainLiteralObject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CustomClassSerializerInterceptor extends ClassSerializerInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextOptions = this.getContextOptions(context);
    const request = context.switchToHttp().getRequest();

    const groups =
      request?.user?.uuid || request?.user?.role === ParticipantRole.CO_HOST
        ? ['role:host']
        : [];

    const options = {
      ...this.defaultOptions,
      ...contextOptions,
      groups: groups,
    };

    return next
      .handle()
      .pipe(
        map((data: PlainLiteralObject | PlainLiteralObject[]) =>
          this.serialize(data, options),
        ),
      );
  }
}
