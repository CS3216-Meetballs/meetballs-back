import { AuthGuard } from '@nestjs/passport';
import { AccessUser } from './../shared/decorators/participant.decorator';
import { AccessGuard } from '../auth/guard/access.guard';
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Query,
  ParseUUIDPipe,
  NotFoundException,
  ForbiddenException,
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
import { Pagination } from 'nestjs-typeorm-paginate';
import { UseAuth, UseBearerAuth } from '../shared/decorators/auth.decorator';
import { Usr } from '../shared/decorators/user.decorator';
import { User } from '../users/user.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { MeetingsService } from './meetings.service';
import { Meeting } from './meeting.entity';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { MeetingSocketGateway } from '../meeting-socket/meeting-socket.gateway';
import { GetMeetingViaMagicLinkDto } from './dto/get-meeting-via-magic-link-response.dto';
import { Participant } from 'src/participants/participant.entity';
import { PaginatedMeetings } from './dto/paginated-meetings.dto';
import { MultipleMeetingQuery } from './dto/multiple-meeting-query.dto';
import { ParticipantRole } from 'src/shared/enum/participant-role.enum';

@ApiTags('Meeting')
@Controller('meeting')
export class MeetingsController {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly meetingGateway: MeetingSocketGateway,
  ) {}

  @ApiOkResponse({
    type: PaginatedMeetings,
    description: 'Paginated List of meetings created by the host',
  })
  @UseBearerAuth()
  @ApiQuery({ name: 'type', enum: ['all', 'upcoming', 'past'] })
  @Get('/')
  public async getMeetings(
    @Query() meetingQuery: MultipleMeetingQuery,
    @Usr() requester: User,
  ): Promise<Pagination<Meeting>> {
    const { limit, page, ...queryOptions } = meetingQuery;

    return this.meetingsService.findMultiple(queryOptions, requester.uuid, {
      limit: Math.min(50, limit),
      page,
    });
  }

  @ApiOkResponse({
    type: GetMeetingViaMagicLinkDto,
    description: 'Meeting with meetingId and information of joiner',
  })
  @ApiBadRequestResponse({
    description: 'Invalid token',
  })
  @ApiBody({
    description:
      'JWT Token containing info on the userEmail, username and meetingId',
  })
  @UseAuth(AuthGuard('participant'))
  @Get('/magic-link')
  public async getMeetingViaMagicLink(
    @AccessUser() participant: Participant,
  ): Promise<GetMeetingViaMagicLinkDto> {
    const meeting = await this.meetingsService.findOneById(
      participant.meetingId,
      true,
    );
    return { meeting, joiner: participant };
  }

  @ApiOkResponse({
    description: 'Successfully retrieved meeting',
    type: Meeting,
  })
  @ApiParam({ name: 'id', description: 'The unique zoom meeting id' })
  @UseAuth(AccessGuard)
  @Get('/:id')
  public async getMeeting(
    @Param('id', ParseUUIDPipe) meetingId: string,
    @AccessUser() userOrParticipant: User | Participant,
  ): Promise<Meeting> {
    if (
      (userOrParticipant as Participant).meetingId &&
      (userOrParticipant as Participant).meetingId !== meetingId
    ) {
      throw new ForbiddenException('Not allowed to access meeting');
    }

    try {
      const meeting = await this.meetingsService.findOneById(meetingId, true);
      if (
        (userOrParticipant as User).uuid &&
        (userOrParticipant as User).uuid !== meeting.hostId
      ) {
        throw new ForbiddenException('Not allowed to access meeting');
      }
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
  @UseAuth(AccessGuard)
  @Post('/start/:id')
  public async startMeeting(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const targetMeeting = await this.meetingsService.findOneById(id, true);

    if (!targetMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== targetMeeting.id ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
    ) {
      throw new ForbiddenException('Cannot start meeting');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        targetMeeting.id,
      ))
    ) {
      throw new ForbiddenException('Cannot start meeting');
    }

    const meeting = await this.meetingsService.startMeeting(targetMeeting);
    this.meetingGateway.emitMeetingUpdated(id, meeting);
    return;
  }

  @ApiCreatedResponse({
    description: 'Successfully ended meeting',
  })
  @ApiParam({ name: 'id', description: 'The unique zoom meeting id' })
  @UseAuth(AccessGuard)
  @Post('/next/:id')
  public async nextMeetingItem(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const targetMeeting = await this.meetingsService.findOneById(id, true);

    if (!targetMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== targetMeeting.id ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
    ) {
      throw new ForbiddenException('Cannot move to next meeting item');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        targetMeeting.id,
      ))
    ) {
      throw new ForbiddenException('Cannot move to next meeting item');
    }

    const meeting = await this.meetingsService.nextMeetingItem(targetMeeting);
    this.meetingGateway.emitMeetingUpdated(id, meeting);
    return;
  }

  @ApiCreatedResponse({
    description: 'Successfully ended meeting',
  })
  @ApiParam({ name: 'id', description: 'The unique zoom meeting id' })
  @UseAuth(AccessGuard)
  @Post('/end/:id')
  public async endMeeting(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const targetMeeting = await this.meetingsService.findOneById(id, true);

    if (!targetMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== targetMeeting.id ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
    ) {
      throw new ForbiddenException('Cannot end meeting');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        targetMeeting.id,
      ))
    ) {
      throw new ForbiddenException('Cannot end meeting');
    }

    const meeting = await this.meetingsService.endMeeting(targetMeeting);
    this.meetingGateway.emitMeetingUpdated(id, meeting);
    return;
  }
}
