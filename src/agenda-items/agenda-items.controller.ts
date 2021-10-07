import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiTags,
} from '@nestjs/swagger';
import { UseBearerAuth } from '../shared/decorators/auth.decorator';
import { AgendaItem } from './agenda-item.entity';
import { AgendaItemsService } from './agenda-items.service';
import { CreateAgendaItemDto } from './dto/create-agenda-item-dto';
import { UpdateAgendaItemDto } from './dto/update-agenda-item-dto';

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

  @ApiOkResponse({
    description: 'Successfully get agenda items',
    type: [AgendaItem],
  })
  @UseBearerAuth()
  @Get('/:id')
  public async getAgendaItemsByMeetingId(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgendaItem[]> {
    return this.agendaItemsService.getAgendaItemsByMeetingId(id);
  }

  @ApiOkResponse({
    description: 'Successfully deleted agenda item',
  })
  @UseBearerAuth()
  @Delete('/:meetingId/:position')
  public async deleteAgendaItemByPosition(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('position', ParseIntPipe) position: number,
  ): Promise<void> {
    await this.agendaItemsService.deleteAgendaItemByMeetingIdAndPosition(
      meetingId,
      position,
    );
  }

  @ApiOkResponse({
    description: 'Successfully updated agenda item',
  })
  @Put('/:meetingId/:position')
  public async updateAgendaItemByPosition(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('position', ParseIntPipe) originalPosition: number,
    @Body() updateAgendaItemDto: UpdateAgendaItemDto,
  ): Promise<void> {
    await this.agendaItemsService.updateAgendaItemByMeetingIdAndPosition(
      meetingId,
      originalPosition,
      updateAgendaItemDto,
    );
  }
}
