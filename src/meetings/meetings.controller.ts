import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  BadRequestException,
  Put,
  Delete,
  Query,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UseBearerAuth } from '../shared/decorators/auth.decorator';
import { Usr } from '../shared/decorators/user.decorator';
import { User } from '../users/user.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { MeetingsService } from './meetings.service';
import { Meeting } from './meeting.entity';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { MeetingSocketGateway } from '../meeting-socket/meeting-socket.gateway';
import { Participant } from 'src/participants/participant.entity';
import { GetMeetingViaMagicLinkDto } from './dto/get-meeting-via-magic-link-response.dto';

@ApiTags('Meeting')
@Controller('meeting')
export class MeetingsController {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly meetingGateway: MeetingSocketGateway,
  ) {}

  @UseBearerAuth()
  @ApiQuery({ name: 'type', enum: ['all', 'upcoming', 'past'] })
  @Get('/')
  public async getMeetings(
    @Query('type') type: 'all' | 'upcoming' | 'past',
    @Usr() requester: User,
  ) {
    const meeting = await this.meetingsService.findMultiple(
      type,
      requester.uuid,
    );
    return meeting;
  }

  @ApiOkResponse({
    description: 'Successfully retrieved meeting',
    type: Meeting,
  })
  @ApiParam({ name: 'id', description: 'The unique zoom meeting id' })
  @Get('/:id')
  public async getMeeting(
    @Param('id', ParseUUIDPipe) meetingId: string,
  ): Promise<Meeting> {
    try {
      const meeting = await this.meetingsService.findOneById(meetingId, true);
      return meeting;
    } catch (error) {
      throw new NotFoundException('Meeting not found');
    }
  }

  @ApiCreatedResponse({
    type: Meeting,
    description: 'Successfully created meeting',
  })
  @ApiBody({ type: CreateMeetingDto })
  @UseBearerAuth()
  @Post('/')
  public async createMeeting(
    @Usr() requester: User,
    @Body() createMeetingDto: CreateMeetingDto,
  ) {
    const createdMeeting = await this.meetingsService.createMeeting(
      createMeetingDto,
      requester,
    );
    return createdMeeting;
  }

  @ApiCreatedResponse({
    description: 'Successfully created meeting',
  })
  @ApiParam({ name: 'id', description: 'The unique zoom meeting id' })
  @ApiBody({ type: UpdateMeetingDto })
  @UseBearerAuth()
  @Put('/:id')
  public async updateMeeting(
    @Usr() requester: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMeetingDto: UpdateMeetingDto,
  ) {
    const requesterId = requester.uuid;
    const updatedMeeting = await this.meetingsService.updateMeeting(
      id,
      updateMeetingDto,
      requesterId,
    );
    this.meetingGateway.emitMeetingUpdated(id, updatedMeeting);
    return;
  }

  @ApiOkResponse({
    description: 'Successfully deleted meeting',
  })
  @ApiParam({ name: 'id', description: 'The unique zoom meeting id' })
  @UseBearerAuth()
  @Delete('/:id')
  public async deleteMeeting(
    @Usr() requester: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const requesterId = requester.uuid;
    await this.meetingsService.deleteMeeting(id, requesterId);
    this.meetingGateway.emitMeetingDeleted(id);
    return;
  }

  @ApiCreatedResponse({
    description: 'Successfully started meeting',
  })
  @ApiParam({ name: 'id', description: 'The unique zoom meeting id' })
  @UseBearerAuth()
  @Post('/start/:id')
  public async startMeeting(
    @Usr() requester: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const requesterId = requester.uuid;
    const meeting = await this.meetingsService.startMeeting(id, requesterId);
    this.meetingGateway.emitMeetingUpdated(id, meeting);
    return;
  }

  @ApiCreatedResponse({
    description: 'Successfully ended meeting',
  })
  @ApiParam({ name: 'id', description: 'The unique zoom meeting id' })
  @UseBearerAuth()
  @Post('/next/:id')
  public async nextMeetingItem(
    @Usr() requester: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const requesterId = requester.uuid;
    const meeting = await this.meetingsService.nextMeetingItem(id, requesterId);
    this.meetingGateway.emitMeetingUpdated(id, meeting);
    return;
  }

  @ApiCreatedResponse({
    description: 'Successfully ended meeting',
  })
  @ApiParam({ name: 'id', description: 'The unique zoom meeting id' })
  @UseBearerAuth()
  @Post('/end/:id')
  public async endMeeting(
    @Usr() requester: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const requesterId = requester.uuid;
    const meeting = await this.meetingsService.endMeeting(id, requesterId);
    this.meetingGateway.emitMeetingUpdated(id, meeting);
    return;
  }

  @ApiOkResponse({
    type: GetMeetingViaMagicLinkDto,
    description: 'Meeting with meetingId and information of joiner',
  })
  @ApiBadRequestResponse({
    description: 'Invalid token',
  })
  @ApiParam({
    name: 'token',
    description:
      'JWT Token containing info on the userEmail, username and meetingId',
  })
  @Get('/magic-link/:token')
  public async getMeetingViaMagicLink(
    @Param('token') token: string,
  ): Promise<GetMeetingViaMagicLinkDto> {
    return this.meetingsService.getMeetingViaMagicLink(token);
  }
}
