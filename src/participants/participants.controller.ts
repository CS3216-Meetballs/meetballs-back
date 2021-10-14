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
import {
  UpdateParticipant,
  UpdateParticipantsDto,
} from './dto/update-participants.dto';
import { Participant } from './participant.entity';
import { ParticipantsService } from './participants.service';
import { MeetingSocketGateway } from '../meeting-socket/meeting-socket.gateway';
import { ParticipantEmailDto } from './dto/participant-email.dto';
import { CreateParticipantsMagicLinkDto } from './dto/create-participant-magic-link.dto';
import { StatusResponseDto } from 'src/shared/dto/result-status.dto';

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
      createdParticipants,
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
  @ApiParam({ name: 'meetingUuid', description: 'Id of meeting' })
  @Get('/:meetingUuid')
  public async getParticipants(
    @Param('meetingUuid', ParseUUIDPipe) meetingId: string,
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
          participant,
        );
        return participant;
      });
  }

  @ApiCreatedResponse({
    description: 'Successfully marked participant as present',
  })
  @UseBearerAuth()
  @ApiBody({ type: ParticipantEmailDto })
  @Put('/:meetingUuid/present')
  public async markPresent(
    @Param('meetingUuid', ParseUUIDPipe) meetingId: string,
    @Body() participantEmail: ParticipantEmailDto,
  ): Promise<void> {
    return this.participantsService
      .markPresent(meetingId, participantEmail)
      .then((participant) => {
        this.meetingGateway.emitParticipantsUpdated(meetingId, participant);
        return;
      });
  }

  @ApiCreatedResponse({
    description: 'Successfully marked participant as absent',
  })
  @UseBearerAuth()
  @ApiBody({ type: ParticipantEmailDto })
  @Put('/:meetingUuid/absent')
  public async markAbsent(
    @Param('meetingUuid', ParseUUIDPipe) meetingId: string,
    @Body() participantEmail: ParticipantEmailDto,
  ): Promise<void> {
    return this.participantsService
      .markAbsent(meetingId, participantEmail)
      .then((participant) => {
        this.meetingGateway.emitParticipantsUpdated(meetingId, participant);
        return;
      });
  }

  @ApiCreatedResponse({
    type: StatusResponseDto,
    description: 'Successfully sent magic links to participants',
  })
  @ApiBody({ type: CreateParticipantsMagicLinkDto })
  @UseBearerAuth()
  @Post('/create-magic-links')
  async createMagicLinks(
    @Body() createParticipantsMagicLinkDto: CreateParticipantsMagicLinkDto,
  ): Promise<StatusResponseDto> {
    const meeting =
      await this.participantsService.getOneMeetingByMeetingIdAndOneUser(
        // Should at least have one and already checked using class-validator
        createParticipantsMagicLinkDto.participants[0],
      );
    const participants: UpdateParticipant[] = [];
    let updateParticipantsDto: UpdateParticipantsDto = {
      meetingId: createParticipantsMagicLinkDto.participants[0].meetingId,
      participants,
    };
    await Promise.all(
      createParticipantsMagicLinkDto.participants.map(async (participant) => {
        const hashedMagicLinkToken =
          await this.participantsService.generateMagicLink(
            participant,
            meeting,
          );
        participants.push({
          userEmail: participant.userEmail,
          hashedMagicLinkToken,
          invited: true,
        });
      }),
    );
    updateParticipantsDto = {
      meetingId: createParticipantsMagicLinkDto.participants[0].meetingId,
      participants,
    };
    await this.participantsService.updateParticipants(updateParticipantsDto);
    return {
      success: true,
      message: 'Successfully sent magic links to participants',
    };
  }
}
