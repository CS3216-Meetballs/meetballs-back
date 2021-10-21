import { IsDefined, IsNumberString, IsString } from 'class-validator';

export class ZoomSyncMeetingDto {
  // MeetBalls meeting ID
  @IsString()
  @IsDefined()
  id: string;

  // The numeric zoom meeting id (not uuid)
  @IsNumberString()
  @IsDefined()
  meetingId: string;

  // Unique meeting ID. Each meeting instance will generate own Meeting UUID
  @IsString()
  @IsDefined()
  zoomUuid: string;
}
