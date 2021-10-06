import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { UseBearerAuth } from '../shared/decorators/auth.decorator';
import { CreateParticipantDto } from './dto/create-participant-dto';
import { Participant } from './participant.entity';
import { ParticipantsService } from './participants.service';

@ApiTags('Participant')
@Controller('participant')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

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
    return this.participantsService.createOneParticipant(createParticipantDto);
  }
}
