import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UseBearerAuth } from '../shared/decorators/auth.decorator';
import {
  CreateParticipantsDto,
  CreateParticipantDto,
} from './dto/create-participant.dto';
import { DeleteParticipantsDto } from './dto/delete-participants.dto';
import { UpdateParticipantsDto } from './dto/update-participants.dto';
import { Participant } from './participant.entity';
import { ParticipantsService } from './participants.service';
import { MeetingSocketGateway } from '../meeting-socket/meeting-socket.gateway';

@ApiTags('Participant')
@Controller('participant')
export class ParticipantsController {
  constructor(
    private readonly participantsService: ParticipantsService,
    private readonly meetingGateway: MeetingSocketGateway,
  ) {}

  @ApiCreatedResponse({
    description: 'Successfully created participant',
    type: [Participant],
  })
  @ApiBody({ type: CreateParticipantsDto })
  @UseBearerAuth()
  @Post('/create-many')
  public async createParticipants(
    @Body() createParticipantsDto: CreateParticipantsDto,
  ): Promise<Participant[]> {
    const createdParticipants =
      await this.participantsService.createParticipants(createParticipantsDto);
    this.meetingGateway.emitParticipantsUpdated(
      createdParticipants[0].meetingId,
    );
    return createdParticipants;
  }

  @ApiOkResponse({
    description: 'Successfully deleted participants',
    type: [Participant],
  })
  @ApiBadRequestResponse({
    description: 'Invalid inputs in request body',
  })
  @ApiBody({ type: DeleteParticipantsDto })
  @UseBearerAuth()
  @Delete('/')
  public async deleteParticipants(
    @Body() deleteParticipantsDto: DeleteParticipantsDto,
  ): Promise<void> {
    return this.participantsService.deleteParticipants(deleteParticipantsDto);
  }

  @ApiOkResponse({
    description: 'Successfully updated participants',
  })
  @ApiBadRequestResponse({
    description: 'Invalid positions in request body',
  })
  @ApiBody({ type: UpdateParticipantsDto })
  @UseBearerAuth()
  @Put('/')
  public async updateParticipants(
    @Body() updateParticipantsDto: UpdateParticipantsDto,
  ): Promise<void> {
    return this.participantsService.updateParticipants(updateParticipantsDto);
  }

  @ApiOkResponse({
    description: 'List of participants attending the meeting',
    type: [Participant],
  })
  @ApiParam({ name: 'meetingId', description: 'Id of meeting' })
  @Get('/:meetingId')
  public async getParticipants(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
  ): Promise<Participant[]> {
    return this.participantsService.getParticipantsByMeetingId(meetingId);
  }

  @ApiCreatedResponse({
    description: 'Successfully created participant',
    type: Participant,
  })
  @UseBearerAuth()
  @ApiBody({ type: CreateParticipantDto })
  @Post('/')
  public async createOneParticipant(
    @Body() createParticipantDto: CreateParticipantDto,
  ): Promise<Participant> {
    return this.participantsService
      .createOneParticipant(createParticipantDto)
      .then((participant) => {
        this.meetingGateway.emitParticipantsUpdated(
          createParticipantDto.meetingId,
        );
        return participant;
      });
  }
}
