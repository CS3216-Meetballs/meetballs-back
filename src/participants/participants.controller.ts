import {
  BadRequestException,
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
  ApiUnauthorizedResponse,
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
import { ParticipantEmailDto } from './dto/participant-email.dto';
import {
  CreateParticipantMagicLinkDto,
  CreateParticipantsMagicLinkDto,
} from './dto/create-participant-magic-link.dto';
import { StatusResponseDto } from 'src/shared/dto/result-status.dto';
import { Usr } from 'src/shared/decorators/user.decorator';
import { User } from 'src/users/user.entity';

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
    description: 'Successfully sent magic links to participant',
  })
  @ApiBadRequestResponse({
    description: 'Meeting has already ended',
  })
  @ApiUnauthorizedResponse({
    description: 'User who send invite is not the host of the meeting',
  })
  @ApiBody({ type: CreateParticipantMagicLinkDto })
  @UseBearerAuth()
  @Post('/send-invite')
  async sendOneMagicLink(
    @Usr() host: User,
    @Body() createParticipantMagicLinkDto: CreateParticipantMagicLinkDto,
  ): Promise<StatusResponseDto> {
    const { userEmail, meetingId } = createParticipantMagicLinkDto;
    const participant = await this.participantsService.findOneParticipant(
      meetingId,
      userEmail,
    );

    await this.participantsService.sendOneInvite(
      participant,
      participant.meeting,
      host,
    );

    return {
      success: true,
      message: `Successfully sent magic link to ${userEmail}`,
    };
  }

  @ApiCreatedResponse({
    type: StatusResponseDto,
    description: 'Sent status of meeting participants',
  })
  @ApiBody({ type: CreateParticipantsMagicLinkDto })
  @UseBearerAuth()
  @Post('/send-multiple-invites')
  async sendMultipleMagicLinks(
    @Usr() host: User,
    @Body() createParticipantsMagicLinkDto: CreateParticipantsMagicLinkDto,
  ): Promise<StatusResponseDto> {
    const promises = createParticipantsMagicLinkDto.participants.map(
      async (details) => {
        const { userEmail, meetingId } = details;
        const participant = await this.participantsService.findOneParticipant(
          meetingId,
          userEmail,
        );

        if (participant.invited) {
          throw new Error('Participant already invited');
        }

        await this.participantsService.sendOneInvite(
          participant,
          participant.meeting,
          host,
        );
        return `Successfully sent magic link to ${userEmail}`;
      },
    );

    let successCount = 0;
    const output = await Promise.allSettled(promises).then((resultArray) => {
      return resultArray.map((res) => {
        if (res.status == 'fulfilled') {
          successCount++;
          return { success: true, message: res.value };
        } else {
          return { success: false, message: res.reason };
        }
      });
    });

    const message = `Successfully sent magic link to ${successCount} participants`;
    console.log(message);

    return {
      success: true,
      message: message,
      data: output,
    };
  }
}
