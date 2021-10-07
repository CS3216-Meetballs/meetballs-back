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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MeetingsGateway } from 'src/meetings/meetings.gateway';
import { UseBearerAuth } from '../shared/decorators/auth.decorator';
import { AgendaItem } from './agenda-item.entity';
import { AgendaItemsService } from './agenda-items.service';
import { CreateAgendaItemDto } from './dto/create-agenda-item.dto';
import { UpdateAgendaItemDto } from './dto/update-agenda-item.dto';
import { UpdateAgendaItemsPositionDto } from './dto/update-agenda-items-position.dto';

@ApiTags('AgendaItem')
@Controller('agenda-item')
export class AgendaItemsController {
  constructor(
    private readonly agendaItemsService: AgendaItemsService,
    private readonly meetingsGateway: MeetingsGateway,
  ) {}

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
  @ApiParam({
    name: 'meetingId',
    description: 'The id of the meeting',
  })
  @UseBearerAuth()
  @Get('/:meetingId')
  public async getAgendaItemsByMeetingId(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
  ): Promise<AgendaItem[]> {
    return this.agendaItemsService.getAgendaItemsByMeetingId(meetingId);
  }

  @ApiOkResponse({
    description: 'Successfully deleted agenda item',
  })
  @ApiParam({ name: 'meetingId', description: 'The id of the meeting' })
  @ApiParam({
    name: 'position',
    description: 'The position of the agenda item',
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
    this.meetingsGateway.emitAgendaUpdated(meetingId);
  }

  @ApiOkResponse({
    description: 'Successfully updated agenda item',
  })
  @ApiBody({
    type: UpdateAgendaItemDto,
  })
  @UseBearerAuth()
  @Put('/:meetingId/:position')
  public async updateAgendaItemByPosition(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('position', ParseIntPipe) position: number,
    @Body() updateAgendaItemDto: UpdateAgendaItemDto,
  ): Promise<void> {
    await this.agendaItemsService.updateAgendaItemByMeetingIdAndPosition(
      meetingId,
      position,
      updateAgendaItemDto,
    );
    this.meetingsGateway.emitAgendaUpdated(meetingId);
  }

  @ApiOkResponse({
    description: 'Successfully reordered agenda items',
  })
  @ApiBody({
    type: UpdateAgendaItemsPositionDto,
  })
  @UseBearerAuth()
  @Put('/positions')
  public async reorderAgendaItemsPosition(
    @Body() updateAgendaItemsPositionDto: UpdateAgendaItemsPositionDto,
  ): Promise<void> {
    await this.agendaItemsService.reorderAgendaItemsPosition(
      updateAgendaItemsPositionDto,
    );
    this.meetingsGateway.emitAgendaUpdated(
      updateAgendaItemsPositionDto.meetingId,
    );
  }
}
