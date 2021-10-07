import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { AgendaItemsService } from '../agenda-items/agenda-items.service';
import { ParticipantsService } from '../participants/participants.service';
import { UseBearerAuth } from '../shared/decorators/auth.decorator';
import { Usr } from '../shared/decorators/user.decorator';
import { User } from '../users/user.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { CreateMeetingResponse } from './interfaces/create-meeting-response.interface';
import { MeetingsService } from './meetings.service';

@ApiTags('Meeting')
@Controller('meeting')
export class MeetingsController {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly participantsService: ParticipantsService,
    private readonly agendaItemsService: AgendaItemsService,
  ) {}

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
  ): Promise<CreateMeetingResponse> {
    const hostId = requester.uuid;
    const createdMeeting = await this.meetingsService.createMeeting(
      createMeetingDto,
      hostId,
    );
    const createdParticipants =
      await this.participantsService.createParticipantsForMeeting(
        createMeetingDto.participants,
        createdMeeting.id,
      );
    console.log('createdParticipants', createdParticipants);
    // create agenda items
    const createdAgendaItems =
      await this.agendaItemsService.createAgendaItemsForMeeting(
        createMeetingDto.agendaItems,
        createdMeeting.id,
      );
    console.log('createdAgendaItems', createdAgendaItems);
    const x = {
      meeting: createdMeeting,
      participants: createdParticipants,
      agendaItems: createdAgendaItems,
    };
    console.log(x);
    return x;
  }
}
