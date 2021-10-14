import { IsString } from 'class-validator';

export class ZoomMeetingDto {
  // Unique meeting ID. Each meeting instance will generate own Meeting UUID
  @IsString()
  uuid: string;
  // meeting ID
  @IsString()
  id: number;
  // host_ID
  host_id: string;
  // host_email
  host_email: string;
  // title
  topic: string;
  // description
  agenda: string;
  // created_at
  created_at: string;
  duration: number;
  join_url: string;
  password: string;
  start_time: string;
  status: 'waiting' | 'started';
  // 1: Instant Meeting
  // 2: Scheduled Meeting
  // 3: Recurring Meeting with no fixed time
  // 8: Recurring Meeting with fixed time
  type: 1 | 2 | 3 | 8;
}
