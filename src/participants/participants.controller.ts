import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParticipantsService } from './participants.service';

@ApiTags('Participant')
@Controller('participant')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}
}
