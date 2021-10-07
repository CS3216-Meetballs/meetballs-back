import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { AgendaItemsService } from '../agenda-items/agenda-items.service';
import { ParticipantsService } from '../participants/participants.service';
import { UseBearerAuth } from '../shared/decorators/auth.decorator';
import { Usr } from '../shared/decorators/user.decorator';
import { User } from '../users/user.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { CreateMeetingResponse } from './interfaces/create-meeting-response.interface';
import { MeetingsService } from './meetings.service';
import { Connection } from 'typeorm';
import { Meeting } from './meeting.entity';
import { Participant } from '../participants/participant.entity';
import { AgendaItem } from '../agenda-items/agenda-item.entity';

@ApiTags('Meeting')
@Controller('meeting')
export class MeetingsController {
  constructor(
    private connection: Connection,
    private readonly meetingsService: MeetingsService,
    private readonly participantsService: ParticipantsService,
    private readonly agendaItemsService: AgendaItemsService,
  ) {}

  @Get('/:id')
  public async getMeeting(@Param('id') meetingId: string) {
    const meeting = await this.meetingsService.findOneById(meetingId);
    return meeting;
  }

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
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const hostId = requester.uuid;
      const createdMeeting = await this.meetingsService.createMeeting(
        createMeetingDto,
        hostId,
      );
      await queryRunner.manager.save(Meeting, createdMeeting);
      const createdParticipants =
        await this.participantsService.createParticipantsForMeeting(
          createMeetingDto.participants,
          createdMeeting.id,
        );
      await queryRunner.manager.save(Participant, createdParticipants);
      // create agenda items
      const createdAgendaItems =
        await this.agendaItemsService.createAgendaItemsForMeeting(
          createMeetingDto.agendaItems,
          createdMeeting.id,
        );
      await queryRunner.manager.save(AgendaItem, createdAgendaItems);
      await queryRunner.commitTransaction();
      return {
        meeting: createdMeeting,
        participants: createdParticipants,
        agendaItems: createdAgendaItems,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      await queryRunner.release();
    }
  }
}
