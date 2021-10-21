import { MeetingsService } from './../meetings/meetings.service';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UseAuth, UseBearerAuth } from '../shared/decorators/auth.decorator';
import { AgendaItem } from './agenda-item.entity';
import { AgendaItemsService } from './agenda-items.service';
import { CreateAgendaItemDto } from './dto/create-agenda-item.dto';
import { UpdateAgendaItemDto } from './dto/update-agenda-item.dto';
import { UpdateAgendaItemsPositionDto } from './dto/update-agenda-items-position.dto';
import { MeetingSocketGateway } from '../meeting-socket/meeting-socket.gateway';
import { AccessGuard } from 'src/participants/guard/access.guard';
import { Usr } from 'src/shared/decorators/user.decorator';
import { User } from 'src/users/user.entity';
import { Participant } from 'src/participants/participant.entity';
import { AccessUser } from 'src/shared/decorators/participant.decorator';

@ApiTags('Agenda Item')
@Controller('agenda-item')
export class AgendaItemsController {
  constructor(
    private readonly agendaItemsService: AgendaItemsService,
    private readonly meetingGateway: MeetingSocketGateway,
    private readonly meetingsService: MeetingsService,
  ) {}

  @ApiCreatedResponse({
    description: 'Successfully created agenda item',
    type: AgendaItem,
  })
  @UseBearerAuth()
  @ApiBody({ type: CreateAgendaItemDto })
  @Post('/')
  public async createAgendaItems(
    @Usr() user: User,
    @Body() createAgendaItemDto: CreateAgendaItemDto,
  ): Promise<AgendaItem> {
    if (
      !(await this.meetingsService.isHostOfMeeting(
        user.uuid,
        createAgendaItemDto.meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to create');
    }
    return this.agendaItemsService.createOneAgendaItem(createAgendaItemDto);
  }

  @ApiOkResponse({
    description: 'Successfully get agenda items',
    type: [AgendaItem],
  })
  @ApiParam({
    name: 'meetingUuid',
    description: 'The id of the meeting',
  })
  @UseAuth(AccessGuard)
  @Get('/:meetingUuid')
  public async getAgendaItemsByMeetingId(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('meetingUuid', ParseUUIDPipe) meetingId: string,
  ): Promise<AgendaItem[]> {
    if (
      userOrParticipant['meetingId'] &&
      (userOrParticipant as Participant).meetingId !== meetingId
    ) {
      throw new ForbiddenException('Not allowed to access meeting');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to access meeting');
    }

    return this.agendaItemsService.getAgendaItemsByMeetingId(meetingId);
  }

  @ApiOkResponse({
    description: 'Successfully deleted agenda item',
  })
  @ApiParam({ name: 'meetingUuid', description: 'The id of the meeting' })
  @ApiParam({
    name: 'position',
    description: 'The position of the agenda item',
  })
  @UseBearerAuth()
  @Delete('/:meetingUuid/:position')
  public async deleteAgendaItemByPosition(
    @Usr() requester: User,
    @Param('meetingUuid', ParseUUIDPipe) meetingId: string,
    @Param('position', ParseIntPipe) position: number,
  ): Promise<void> {
    if (
      !(await this.meetingsService.isHostOfMeeting(requester.uuid, meetingId))
    ) {
      throw new ForbiddenException('Not allowed to delete agenda');
    }
    await this.agendaItemsService.deleteAgendaItemByMeetingIdAndPosition(
      meetingId,
      position,
    );
    this.meetingGateway.emitAgendaUpdated(meetingId);
  }

  @ApiOkResponse({
    description: 'Successfully updated agenda item',
  })
  @ApiBody({
    type: UpdateAgendaItemDto,
  })
  @UseAuth(AccessGuard)
  @Put('/:meetingUuid/:position')
  public async updateAgendaItemByPosition(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('meetingUuid', ParseUUIDPipe) meetingId: string,
    @Param('position', ParseIntPipe) position: number,
    @Body() updateAgendaItemDto: UpdateAgendaItemDto,
  ): Promise<void> {
    const targetAgenda =
      await this.agendaItemsService.getAgendaItemByMeetingIdAndPosition(
        meetingId,
        position,
      );
    if (!targetAgenda) {
      throw new NotFoundException(`Agenda item not found`);
    }

    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== meetingId ||
        (userOrParticipant as Participant).id !== targetAgenda?.speaker?.id)
    ) {
      throw new ForbiddenException('Not allowed to update agenda');
    } else if (
      userOrParticipant['uuid'] &&
      (userOrParticipant as User).uuid !== targetAgenda?.meeting?.hostId
    ) {
      throw new ForbiddenException('Not allowed to access meeting');
    }

    await this.agendaItemsService.updateAgendaItemByMeetingIdAndPosition(
      targetAgenda,
      updateAgendaItemDto,
    );
    this.meetingGateway.emitAgendaUpdated(meetingId);
  }

  @ApiOkResponse({
    description: 'Successfully reordered agenda items',
  })
  @ApiBody({
    type: UpdateAgendaItemsPositionDto,
  })
  @UseBearerAuth()
  @Put('/positions')
  public async reorderAgendaItemsPosition(
    @Usr() requester: User,
    @Body() updateAgendaItemsPositionDto: UpdateAgendaItemsPositionDto,
  ): Promise<void> {
    if (
      !(await this.meetingsService.isHostOfMeeting(
        requester.uuid,
        updateAgendaItemsPositionDto.meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to move agenda');
    }
    await this.agendaItemsService.reorderAgendaItemsPosition(
      updateAgendaItemsPositionDto,
    );
    this.meetingGateway.emitAgendaUpdated(
      updateAgendaItemsPositionDto.meetingId,
    );
  }
}
