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
    const options = {
      ...this.defaultOptions,
      ...contextOptions,
      groups: request?.user?.uuid ? ['role:host'] : [], // Pseudo
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
