import { MeetingsService } from './../meetings/meetings.service';
import { AccessUser } from '../shared/decorators/participant.decorator';
import { AccessGuard } from '../auth/guard/access.guard';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { UseAuth } from '../shared/decorators/auth.decorator';
import {
  CreateParticipantsDto,
  CreateParticipantDto,
} from './dto/create-participant.dto';
import { DeleteParticipantsDto } from './dto/delete-participants.dto';
import { UpdateParticipantDto } from './dto/update-participants.dto';
import { Participant } from './participant.entity';
import { ParticipantsService } from './participants.service';
import { MeetingSocketGateway } from '../meeting-socket/meeting-socket.gateway';
import { ParticipantDto } from './dto/participant-email.dto';
import {
  CreateParticipantMagicLinkDto,
  CreateParticipantsMagicLinkDto,
} from './dto/create-participant-magic-link.dto';
import { StatusResponseDto } from 'src/shared/dto/result-status.dto';
import { User } from 'src/users/user.entity';
import { ParticipantRole } from 'src/shared/enum/participant-role.enum';

@ApiTags('Participant')
@Controller('participant')
export class ParticipantsController {
  constructor(
    private readonly participantsService: ParticipantsService,
    private readonly meetingGateway: MeetingSocketGateway,
    private readonly meetingsService: MeetingsService,
  ) {}

  /**
   * @deprecated
   */
  @ApiCreatedResponse({
    description: 'Successfully created participants',
    type: [Participant],
  })
  @ApiBadRequestResponse({
    description:
      'There are participants with duplicate emails in the request body OR Participants with some of the emails already exist',
  })
  @ApiBody({ type: CreateParticipantsDto })
  @UseAuth(AccessGuard)
  @Post('/create-many')
  public async createParticipants(
    @AccessUser() userOrParticipant: User | Participant,
    @Body() createParticipantsDto: CreateParticipantsDto,
  ): Promise<Participant[]> {
    const meetingId = createParticipantsDto.participants[0].meetingId;

    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== meetingId ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
    ) {
      throw new ForbiddenException('Not allowed to create');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to create');
    }

    const createdParticipants =
      await this.participantsService.createParticipants(createParticipantsDto);
    createdParticipants.forEach((participant) =>
      this.meetingGateway.emitParticipantsUpdated(meetingId, participant),
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
  @UseAuth(AccessGuard)
  @Delete('/')
  public async deleteParticipants(
    @AccessUser() userOrParticipant: User | Participant,
    @Body() deleteParticipantsDto: DeleteParticipantsDto,
  ): Promise<void> {
    const meetingId = deleteParticipantsDto.meetingId;
    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== meetingId ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
    ) {
      throw new ForbiddenException('Not allowed to delete');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to delete');
    }

    if (
      (userOrParticipant as Participant).id &&
      deleteParticipantsDto.participants.findIndex(
        (p) => p.participantId === (userOrParticipant as Participant).id,
      )
    ) {
      throw new ForbiddenException('Not allowed to delete yourself');
    }

    await this.participantsService.deleteParticipants(
      deleteParticipantsDto,
      (userOrParticipant as User).email,
    );

    deleteParticipantsDto.participants.forEach((p) =>
      this.meetingGateway.emitParticipantsDeleted(
        deleteParticipantsDto.meetingId,
        p.participantId,
      ),
    );

    return;
  }

  @ApiOkResponse({
    description: 'Successfully updated participants',
  })
  @ApiBadRequestResponse({
    description: 'Invalid positions in request body',
  })
  @ApiBody({ type: UpdateParticipantDto })
  @UseAuth(AccessGuard)
  @Put('/')
  public async updateParticipant(
    @AccessUser() userOrParticipant: User | Participant,
    @Body() updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant> {
    const meetingId = updateParticipantDto.meetingId;
    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== meetingId ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
    ) {
      throw new ForbiddenException('Not allowed to update');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to update');
    }

    return this.participantsService
      .updateParticipant(updateParticipantDto)
      .then((participant) => {
        this.meetingGateway.emitParticipantsUpdated(
          updateParticipantDto.meetingId,
          participant,
        );
        return participant;
      });
  }

  @ApiOkResponse({
    description: 'List of participants attending the meeting',
    type: [Participant],
  })
  @ApiParam({ name: 'meetingUuid', description: 'Id of meeting' })
  @UseAuth(AccessGuard)
  @Get('/:meetingUuid')
  public async getParticipants(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('meetingUuid', ParseUUIDPipe) meetingId: string,
  ): Promise<Participant[]> {
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

    return this.participantsService.getParticipantsByMeetingId(meetingId);
  }

  @ApiCreatedResponse({
    description: 'Successfully created participant',
    type: Participant,
  })
  @UseAuth(AccessGuard)
  @ApiBody({ type: CreateParticipantDto })
  @Post('/')
  public async createOneParticipant(
    @AccessUser() userOrParticipant: User | Participant,
    @Body() createParticipantDto: CreateParticipantDto,
  ): Promise<Participant> {
    const meetingId = createParticipantDto.meetingId;
    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== meetingId ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
    ) {
      throw new ForbiddenException('Not allowed to create');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to create');
    }

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
  @UseAuth(AccessGuard)
  @ApiBody({ type: ParticipantDto })
  @Put('/:meetingUuid/present')
  public async markPresent(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('meetingUuid', ParseUUIDPipe) meetingId: string,
    @Body() participantEmail: ParticipantDto,
  ): Promise<void> {
    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== meetingId ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
    ) {
      throw new ForbiddenException('Not allowed to update');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to update');
    }

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
  @UseAuth(AccessGuard)
  @ApiBody({ type: ParticipantDto })
  @Put('/:meetingUuid/absent')
  public async markAbsent(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('meetingUuid', ParseUUIDPipe) meetingId: string,
    @Body() participantEmail: ParticipantDto,
  ): Promise<void> {
    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== meetingId ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
    ) {
      throw new ForbiddenException('Not allowed to update');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to update');
    }

    return this.participantsService
      .markAbsent(meetingId, participantEmail)
      .then((participant) => {
        this.meetingGateway.emitParticipantsUpdated(meetingId, participant);
        return;
      });
  }

  @ApiCreatedResponse({
    description: 'Successfully marked participant as duplicate',
  })
  @UseAuth(AccessGuard)
  @ApiBody({ type: ParticipantDto })
  @Put('/:meetingUuid/duplicate')
  public async markDuplicate(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('meetingUuid', ParseUUIDPipe) meetingId: string,
    @Body() participantEmail: ParticipantDto,
  ): Promise<void> {
    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== meetingId ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
    ) {
      throw new ForbiddenException('Not allowed to update');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to update');
    }

    return this.participantsService
      .markDuplicate(meetingId, participantEmail)
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
  @UseAuth(AccessGuard)
  @Post('/send-invite')
  async sendOneMagicLink(
    @AccessUser() userOrParticipant: User | Participant,
    @Body() createParticipantMagicLinkDto: CreateParticipantMagicLinkDto,
  ): Promise<StatusResponseDto> {
    const { userEmail, meetingId } = createParticipantMagicLinkDto;

    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== meetingId ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
    ) {
      throw new ForbiddenException('Not allowed to send invite');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to send invite');
    }

    const participant = await this.participantsService.findOneParticipant(
      meetingId,
      userEmail,
      ['meeting'],
    );

    if (userOrParticipant['uuid']) {
      const host = userOrParticipant as User;
      await this.participantsService.sendOneInvite(
        participant,
        participant.meeting,
        host,
      );
    } else {
      const { userName, userEmail } = userOrParticipant as Participant;
      await this.participantsService.sendOneInvite(
        participant,
        participant.meeting,
        { firstName: userName, email: userEmail },
      );
    }

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
  @UseAuth(AccessGuard)
  @Post('/send-multiple-invites')
  async sendMultipleMagicLinks(
    @AccessUser() userOrParticipant: User | Participant,
    @Body() createParticipantsMagicLinkDto: CreateParticipantsMagicLinkDto,
  ): Promise<StatusResponseDto> {
    const meetingId = createParticipantsMagicLinkDto.participants[0].meetingId;
    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== meetingId ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
    ) {
      throw new ForbiddenException('Not allowed to send invites');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to send invites');
    }

    let host: { firstName: string; email: string };
    if (userOrParticipant['uuid']) {
      host = userOrParticipant as User;
    } else {
      const { userName, userEmail } = userOrParticipant as Participant;
      host = { firstName: userName, email: userEmail };
    }

    const promises = createParticipantsMagicLinkDto.participants.map(
      async (details) => {
        const { userEmail, meetingId } = details;
        const participant = await this.participantsService.findOneParticipant(
          meetingId,
          userEmail,
          ['meeting'],
        );

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
