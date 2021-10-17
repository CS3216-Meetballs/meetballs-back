import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNil } from 'lodash';
import { In, MoreThan, Repository } from 'typeorm';
import { AgendaItem } from './agenda-item.entity';
import { CreateAgendaItemDto } from './dto/create-agenda-item.dto';
import { UpdateAgendaItemDto } from './dto/update-agenda-item.dto';
import { UpdateAgendaItemsPositionDto } from './dto/update-agenda-items-position.dto';

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
          speakerId: updateAgendaItemDto.speakerId || null,
          speakerMaterials: updateAgendaItemDto.speakerMaterials || null,
          speakerName: updateAgendaItemDto.speakerName || null,
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

  public async reorderAgendaItemsPosition(
    updateAgendaItemsPositionDto: UpdateAgendaItemsPositionDto,
  ): Promise<void> {
    const { meetingId, positions } = updateAgendaItemsPositionDto;
    const listOfOldPositions: number[] = [
      ...new Set(
        [...positions].map((position) => {
          return position.oldPosition;
        }),
      ),
    ];
    const listOfNewPositions: number[] = [
      ...new Set(
        [...positions].map((position) => {
          return position.newPosition;
        }),
      ),
    ];
    let agendaItemsToReorder = await this.agendaItemRepository.find({
      meetingId,
      position: In(listOfOldPositions),
    });
    if (
      agendaItemsToReorder.length !== positions.length ||
      listOfNewPositions.length !== positions.length
    ) {
      // Cause probably not user's fault but we forgot to consider some edge case.
      throw new InternalServerErrorException('Error in positions array');
    }
    agendaItemsToReorder = agendaItemsToReorder.map((agendaItem) => {
      const oldPosition = agendaItem.position;
      const newPosition = positions.find(
        (position) => position.oldPosition === oldPosition,
      ).newPosition;
      if (isNil(newPosition)) {
        throw new InternalServerErrorException();
      }
      return {
        ...agendaItem,
        position: newPosition,
      };
    });
    await this.agendaItemRepository.save(agendaItemsToReorder);
  }
}
