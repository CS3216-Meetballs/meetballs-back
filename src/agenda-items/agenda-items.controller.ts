import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { UseBearerAuth } from '../shared/decorators/auth.decorator';
import { AgendaItem } from './agenda-item.entity';
import { AgendaItemsService } from './agenda-items.service';
import { CreateAgendaItemDto } from './dto/create-agenda-item-dto';

@ApiTags('AgendaItem')
@Controller('agenda-item')
export class AgendaItemsController {
  constructor(private readonly agendaItemsService: AgendaItemsService) {}

  @ApiCreatedResponse({
    description: 'Successfully created agenda item',
    type: AgendaItem,
  })
  @UseBearerAuth()
  @ApiBody({ type: CreateAgendaItemDto })
  @Post('/')
  public async createAgendaItems(
    @Body() createAgendaItemDto: CreateAgendaItemDto,
  ): Promise<AgendaItem> {
    return this.agendaItemsService.createOneAgendaItem(createAgendaItemDto);
  }
}
