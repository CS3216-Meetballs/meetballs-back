import { IsArray, IsDefined, IsNumber, IsString } from 'class-validator';

export class ZoomRecordingFilePayload {
  @IsString()
  id: string;

  @IsString()
  meeting_id: string;

  @IsString()
  recording_start: string;

  @IsString()
  recording_end: string;

  @IsString()
  file_type: string;

  @IsNumber()
  file_size: number;

  @IsString()
  play_url: string;

  @IsString()
  download_url: string;

  @IsString()
  status: 'completed';

  @IsString()
  recording_type: string;
}

export class ZoomRecordingMeetingPayload {
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

  @IsString()
  host_email: string;

  @IsNumber()
  duration: number;

  @IsString()
  share_url: string;

  @IsNumber()
  total_size: number;

  @IsNumber()
  recording_count: number;

  @IsArray()
  recording_files: ZoomRecordingFilePayload[];
}

export class ZoomRecordingSubscriptionDto {
  @IsString()
  event: 'recording.completed';
  // timestamp
  @IsNumber()
  event_ts: number;

  @IsDefined()
  payload: {
    account_id: string;
    object: ZoomRecordingMeetingPayload;
  };
}
