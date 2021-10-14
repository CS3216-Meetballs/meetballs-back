import { PickType, PartialType } from '@nestjs/swagger';
import { CreateMeetingDto } from './../../meetings/dto/create-meeting.dto';

export class ZoomMeetingOptionsDto extends PartialType(
  PickType(CreateMeetingDto, [
    'enableTranscription',
    'participants',
    'agendaItems',
  ]),
) {}
