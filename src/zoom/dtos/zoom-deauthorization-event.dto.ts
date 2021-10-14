import { IsString, IsDefined } from 'class-validator';

export class ZoomDeauthorizePayload {
  @IsString()
  user_id: string;

  @IsString()
  account_id: string;

  @IsString()
  signature: string;

  @IsString()
  deauthorization_time: string;

  @IsString()
  client_id: string;
}

export class ZoomDeauthorizeSubscriptionDto {
  @IsString()
  event: 'app_deauthorized';

  @IsDefined()
  payload: ZoomDeauthorizePayload;
}
