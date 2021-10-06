import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';

@ApiTags('Meeting')
@Controller('meeting')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}
}
