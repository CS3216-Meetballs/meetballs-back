import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { MeetingsGateway } from 'src/meetings/meetings.gateway';
import { UseBearerAuth } from '../shared/decorators/auth.decorator';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { Participant } from './participant.entity';
import { ParticipantsService } from './participants.service';

@ApiTags('Participant')
@Controller('participant')
export class ParticipantsController {
  constructor(
    private readonly participantsService: ParticipantsService,
    private readonly meetingsGateway: MeetingsGateway,
  ) {}

  @ApiCreatedResponse({
    description: 'Successfully created participant',
    type: Participant,
  })
  @UseBearerAuth()
  @ApiBody({ type: CreateParticipantDto })
  @Post('/')
  public async createOneP(
    @Body() createParticipantDto: CreateParticipantDto,
  ): Promise<Participant> {
    return this.participantsService
      .createOneParticipant(createParticipantDto)
      .then((participant) => {
        this.meetingsGateway.emitParticipantsUpdated(
          createParticipantDto.meetingId,
        );
        return participant;
      });
  }
}
