import { PartialType, PickType } from '@nestjs/swagger';
import { CreateMeetingDto } from './create-meeting.dto';

export class UpdateMeetingDto extends PartialType(
  PickType(CreateMeetingDto, [
    'name',
    'description',
    'duration',
    'enableTranscription',
  ]),
) {}
