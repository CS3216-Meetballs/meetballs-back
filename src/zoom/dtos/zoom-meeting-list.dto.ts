import { ZoomMeetingDto } from './zoom-meeting.dto';
import { OmitType } from '@nestjs/swagger';

export class MinZoomMeetingDto extends OmitType(ZoomMeetingDto, [
  'host_email',
  'password',
]) {}

export class ZoomMeetingListDto {
  meetings: MinZoomMeetingDto[];
}
