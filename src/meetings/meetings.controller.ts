import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateMeetingDto } from './dto/create-meeting-dto';
import { MeetingsService } from './meetings.service';

@ApiTags('Meeting')
@Controller('meeting')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post('/test')
  public async createOne(@Body() createMeetingDto: CreateMeetingDto) {
    return this.meetingsService.createOne(createMeetingDto);
  }
}
