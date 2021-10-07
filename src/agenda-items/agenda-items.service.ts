import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { AgendaItem } from './agenda-item.entity';
import { CreateAgendaItemDto } from './dto/create-agenda-item-dto';
import { UpdateAgendaItemDto } from './dto/update-agenda-item-dto';

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
    const createdAgendaItem = await this.agendaItemRepository.save(
      agendaItemToBeCreated,
    );
    await this.updateAgendaItemsPosition(meetingId, position);
    return createdAgendaItem;
  }

  public async createAgendaItemsForMeeting(
    createAgendaItemDto: CreateAgendaItemDto[],
    meetingId: string,
  ): Promise<AgendaItem[]> {
    const agendaItemsToCreate: AgendaItem[] = [];
    createAgendaItemDto.forEach((agendaItem) => {
      agendaItemsToCreate.push({ ...agendaItem, meetingId });
    });
    // return this.agendaItemRepository.save(agendaItemsToCreate);
    return agendaItemsToCreate;
  }

  public async getAgendaItemsByMeetingId(
    meetingId: string,
  ): Promise<AgendaItem[]> {
    return this.agendaItemRepository.find({
      where: [{ meetingId }],
      order: {
        position: 'ASC',
      },
    });
  }

  public async getOneByMeetingIdAndPosition(
    meetingId: string,
    position: number,
  ): Promise<AgendaItem> {
    return this.agendaItemRepository.findOne({
      meetingId,
      position,
    });
  }

  public async deleteAgendaItemByMeetingIdAndPosition(
    meetingId: string,
    position: number,
  ) {
    const agendaItemToBeDeleted = await this.getOneByMeetingIdAndPosition(
      meetingId,
      position,
    );
    if (!agendaItemToBeDeleted) {
      throw new NotFoundException(
        `Agenda Item with meetingId ${meetingId} and position ${position} not found`,
      );
    }
    try {
      await this.agendaItemRepository.delete({
        meetingId,
        position,
      });
      await this.updateAgendaItemsPosition(meetingId, position);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  // Decrement the positions of the agenda items with a greater position by 1 (Is this necessary?)
  private async updateAgendaItemsPosition(
    meetingId: string,
    position: number,
  ): Promise<void> {
    await this.agendaItemRepository
      .createQueryBuilder()
      .update(AgendaItem)
      .set({
        position: () => 'position - 1',
      })
      .where({ meetingId, position: MoreThan(position) })
      .execute();
  }

  public async updateAgendaItemByMeetingIdAndPosition(
    meetingId: string,
    position: number,
    updateAgendaItemDto: UpdateAgendaItemDto,
  ): Promise<void> {
    const agendaItemToUpdate = await this.agendaItemRepository.findOne({
      meetingId,
      position,
    });
    if (!agendaItemToUpdate) {
      throw new NotFoundException(
        `Agenda Item with meetingId ${meetingId} and position ${position} not found`,
      );
    }
    try {
      await this.agendaItemRepository
        .createQueryBuilder()
        .update(AgendaItem)
        .set({
          ...updateAgendaItemDto,
        })
        .where({
          meetingId,
          position,
        })
        .execute();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}
