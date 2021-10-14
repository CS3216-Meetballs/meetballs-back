import { IsString, IsDefined, IsNumber } from 'class-validator';

export class ZoomParticipantJoinedPayload {
  @IsString()
  user_id: string;

  @IsString()
  user_name: string;

  @IsString()
  email: string;

  @IsString()
  id: string;

  @IsString()
  join_time: string;

  @IsString()
  registrant_id: string;

  @IsString()
  participant_user_id: string;
}

// export class ZoomParticipantLeftPayload {
//   user_id: string;
//   user_name: string;
//   email: string;
//   id: string;
//   leave_time: string;
//   registrant_id: string;
//   participant_user_id: string;
// }

export class ZoomJoinMeetingPayload {
  @IsString()
  id: string;

  @IsString()
  uuid: string;

  @IsString()
  host_id: string;

  @IsString()
  topic: string;

  @IsNumber()
  type: number;

  @IsString()
  start_time: string;

  @IsString()
  timezone: string;

  @IsNumber()
  duration: number;

  @IsDefined()
  participant: ZoomParticipantJoinedPayload;
}

export class ZoomJoinedSubscriptionDto {
  @IsString()
  event: 'meeting.participant_joined';
  // event: 'meeting.participant_left';

  // timestamp
  @IsNumber()
  event_ts: number;

  @IsDefined()
  payload: {
    account_id: string;
    object: ZoomJoinMeetingPayload;
  };
}
