import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { UseBearerAuth } from '../shared/decorators/auth.decorator';
import { Usr } from '../shared/decorators/user.decorator';
import { User } from '../users/user.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { CreateMeetingResponse } from './interfaces/create-meeting-response.interface';
import { MeetingsService } from './meetings.service';

@ApiTags('Meeting')
@Controller('meeting')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @ApiCreatedResponse({
    type: CreateMeetingResponse,
    description: 'Successfully created meeting',
  })
  @ApiBody({ type: CreateMeetingDto })
  @UseBearerAuth()
  @Post('/')
  public async createMeeting(
    @Usr() requester: User,
    @Body() createMeetingDto: CreateMeetingDto,
  ) {
    try {
      const hostId = requester.uuid;
      const createdMeeting = await this.meetingsService.createMeeting(
        createMeetingDto,
        hostId,
      );
      return createdMeeting;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}
