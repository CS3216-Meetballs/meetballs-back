import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgendaItemsService } from './agenda-items.service';

@ApiTags('AgendaItem')
@Controller('agenda-item')
export class AgendaItemsController {
  constructor(private readonly agendaItemsService: AgendaItemsService) {}
}
