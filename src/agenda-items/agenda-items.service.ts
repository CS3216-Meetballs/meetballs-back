import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgendaItem } from './agenda-item.entity';
import { CreateAgendaItemDto } from './dto/create-agenda-item-dto';

@Injectable()
export class AgendaItemsService {
  constructor(
    @InjectRepository(AgendaItem)
    private agendaItemRepository: Repository<AgendaItem>,
  ) {}

  public async createOneAgendaItem(
    createAgendaItemDto: CreateAgendaItemDto,
  ): Promise<AgendaItem> {
    const { meetingId, position } = createAgendaItemDto;
    const agendaItem = await this.agendaItemRepository.findOne({
      meetingId,
      position,
    });
    if (agendaItem) {
      throw new BadRequestException(
        `Agenda item with position ${position} already exists`,
      );
    }
    const agendaItemToBeCreated = this.agendaItemRepository.create({
      ...createAgendaItemDto,
    });
    return this.agendaItemRepository.save(agendaItemToBeCreated);
  }

  public async createAgendaItemsForMeeting(
    createAgendaItemDto: CreateAgendaItemDto[],
    meetingId: string,
  ): Promise<AgendaItem[]> {
    const agendaItemsToCreate: AgendaItem[] = [];
    createAgendaItemDto.forEach((agendaItem) => {
      agendaItemsToCreate.push({ ...agendaItem, meetingId });
    });
    return this.agendaItemRepository.save(agendaItemsToCreate);
  }
}
