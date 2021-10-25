import {
  MeetingOrderBy,
  MeetingQueryType,
  MultipleMeetingQuery,
} from './dto/multiple-meeting-query.dto';
import { ParticipantRole } from 'src/shared/enum/participant-role.enum';
import { AgendaItem } from './../agenda-items/agenda-item.entity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Pagination,
  IPaginationOptions,
  paginate,
} from 'nestjs-typeorm-paginate';
import { InjectRepository } from '@nestjs/typeorm';
import { Any, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { Meeting } from './meeting.entity';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { ZoomMeetingStatus } from '../shared/enum/zoom-meeting-status.enum';
import { isArray } from 'lodash';
import { JwtConfigService } from 'src/config/jwt.config';
import { User } from 'src/users/user.entity';
import { randomBytes, createCipheriv, scryptSync } from 'crypto';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(AgendaItem)
    private readonly agendaRepository: Repository<AgendaItem>,
    private readonly jwtConfigService: JwtConfigService,
  ) {}

  public async findMultiple(
    queryOptions: Omit<MultipleMeetingQuery, 'page' | 'limit'>,
    requesterId: string,
    pagingOptions: IPaginationOptions,
  ): Promise<Pagination<Meeting>> {
    const { type, orderBy } = queryOptions;

    let queryBuilder: SelectQueryBuilder<Meeting> =
      this.meetingRepository.createQueryBuilder('m');
    queryBuilder = queryBuilder.andWhere('m.host_id = :requesterId', {
      requesterId,
    });
    if (type !== MeetingQueryType.ALL) {
      queryBuilder = queryBuilder.andWhere('m.type = ANY(:types)', {
        types:
          type === MeetingQueryType.PAST
            ? [ZoomMeetingStatus.ENDED]
            : [ZoomMeetingStatus.WAITING, ZoomMeetingStatus.STARTED],
      });
    }

    queryBuilder = queryBuilder.orderBy(
      'm.started_at',
      orderBy === MeetingOrderBy.ASCENDING ? 'ASC' : 'DESC',
    );

    return paginate<Meeting>(queryBuilder, pagingOptions);
  }

  public async findOneById(
    id: string,
    includeRelation = false,
  ): Promise<Meeting> {
    return this.meetingRepository.findOne(
      { id },
      {
        relations: includeRelation
          ? ['participants', 'agendaItems']
          : undefined,
      },
    );
  }

  public async createMeeting(createMeetingDto: CreateMeetingDto, host: User) {
    // check zoom meeting
    if (createMeetingDto.zoomUuid) {
      const zoomMeeting = await this.meetingRepository.findOne({
        zoomUuid: createMeetingDto.zoomUuid,
      });
      if (zoomMeeting)
        throw new ConflictException('Zoom meeting already exist');
    }
    const key = scryptSync(
      this.jwtConfigService.meetingSecret.secret,
      'salt',
      32,
    );

    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-ctr', key, iv);
    const encryptedPassword = [
      Buffer.concat([
        cipher.update(createMeetingDto.meetingPassword),
        cipher.final(),
      ]).toString('base64'),
      Buffer.from(iv).toString('base64'),
    ].join('|');

    const meetingToCreate = this.meetingRepository.create({
      ...createMeetingDto,
      meetingPassword: encryptedPassword,
      host,
      participants: createMeetingDto.participants || [
        {
          userEmail: host.email,
          userName: host.firstName,
          role: ParticipantRole.ADMIN,
          invited: true,
        },
      ],
      agendaItems: createMeetingDto.agendaItems || [
        {
          position: 0,
          name: 'Your 1st meeting item',
          description: 'Click the edit button to edit this agenda item',
          expectedDuration: 1800000, // 30min
        },
      ],
    });
    try {
      const createdMeeting = await this.meetingRepository.save(meetingToCreate);
      return this.findOneById(createdMeeting.id, true);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  public async updateMeeting(
    targetId: string,
    updateMeetingDto: UpdateMeetingDto,
    requesterId: string,
  ): Promise<Meeting> {
    const targetMeeting = await this.meetingRepository.findOne(targetId);
    if (!targetMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (targetMeeting.hostId !== requesterId) {
      throw new ForbiddenException('Cannot modify meeting');
    }

    const meetingToUpdate = this.meetingRepository.create({
      ...targetMeeting,
      ...updateMeetingDto,
    });
    const updatedMeeting = await this.meetingRepository.save(meetingToUpdate);
    return this.findOneById(updatedMeeting.id, false);
  }

  async deleteMeeting(targetId: string, requesterId: string) {
    const targetMeeting = await this.meetingRepository.findOne(targetId);
    if (!targetMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (targetMeeting.hostId !== requesterId) {
      throw new ForbiddenException('Cannot delete meeting');
    }
    return this.meetingRepository.remove(targetMeeting);
  }

  public async doesMeetingExist(meetingUuid: string): Promise<boolean> {
    return !!(await this.meetingRepository.findOne({ id: meetingUuid }));
  }

  async startMeeting(targetId: string, requesterId: string): Promise<Meeting> {
    const currTime = new Date();
    const targetMeeting = await this.meetingRepository.findOne(
      { id: targetId },
      { relations: ['agendaItems'] },
    );
    if (!targetMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (targetMeeting.hostId !== requesterId) {
      throw new ForbiddenException('Cannot start meeting');
    }

    if (targetMeeting.type != ZoomMeetingStatus.WAITING) {
      throw new BadRequestException('Cannot start an ongoing or ended meeting');
    }

    targetMeeting.startedAt = currTime;
    targetMeeting.type = ZoomMeetingStatus.STARTED;

    if (targetMeeting.agendaItems && targetMeeting.agendaItems.length > 0) {
      const firstAgendaItem = targetMeeting.agendaItems.reduce((prev, curr) => {
        return prev.position < curr.position ? prev : curr;
      });
      firstAgendaItem.startTime = currTime;
      firstAgendaItem.isCurrent = true;
      await this.agendaRepository.save(firstAgendaItem);
    }

    await this.meetingRepository.save(targetMeeting);
    return targetMeeting;
  }

  public async nextMeetingItem(targetId: string, requesterId: string) {
    const currTime = new Date();
    const targetMeeting = await this.meetingRepository.findOne(
      { id: targetId },
      { relations: ['agendaItems'] },
    );
    if (!targetMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (targetMeeting.hostId !== requesterId) {
      throw new ForbiddenException('Cannot move to next meeting item');
    }

    if (!targetMeeting.agendaItems || targetMeeting.agendaItems.length <= 1) {
      throw new BadRequestException('No next agenda item');
    }

    if (targetMeeting.type != ZoomMeetingStatus.STARTED) {
      throw new BadRequestException('Meeting not started');
    }

    const agendaItems = targetMeeting.agendaItems.sort(
      (a, b) => a.position - b.position,
    );

    const activePosition = agendaItems.findIndex((a) => a.isCurrent);

    if (activePosition + 1 >= agendaItems.length) {
      throw new BadRequestException('No next agenda item');
    }
    const currAgenda = agendaItems[activePosition];
    const nextAgenda = agendaItems[activePosition + 1];
    currAgenda.isCurrent = false;
    currAgenda.actualDuration =
      currTime.getTime() - currAgenda.startTime.getTime();

    nextAgenda.isCurrent = true;
    nextAgenda.startTime = currTime;

    targetMeeting.agendaItems = agendaItems;
    await this.agendaRepository.save([currAgenda, nextAgenda]);
    return targetMeeting;
  }

  async endMeeting(targetId: string, requesterId: string): Promise<Meeting> {
    const currTime = new Date();
    const targetMeeting = await this.meetingRepository.findOne(
      { id: targetId },
      { relations: ['agendaItems'] },
    );
    if (!targetMeeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (targetMeeting.hostId !== requesterId) {
      throw new ForbiddenException('Cannot end meeting');
    }

    if (targetMeeting.type != ZoomMeetingStatus.STARTED) {
      throw new BadRequestException(
        'Cannot end a meeting that did not start or has ended',
      );
    }

    targetMeeting.endedAt = currTime;
    targetMeeting.type = ZoomMeetingStatus.ENDED;
    if (targetMeeting.agendaItems && isArray(targetMeeting.agendaItems)) {
      // last agenda item or just generally any item
      const lastAgendaItemList = targetMeeting.agendaItems.filter(
        (a) => a.isCurrent,
      );
      if (lastAgendaItemList.length > 0) {
        const lastAgendaItem = lastAgendaItemList[0];
        lastAgendaItem.isCurrent = false;
        lastAgendaItem.actualDuration =
          currTime.getTime() - lastAgendaItem.startTime.getTime();
        await this.agendaRepository.save(lastAgendaItem);
      }
    }
    await this.meetingRepository.save(targetMeeting);
    return targetMeeting;
  }

  public async isHostOfMeeting(hostId: string, id: string): Promise<boolean> {
    const meeting = await this.meetingRepository.findOne({ id, hostId });
    return !!meeting;
  }
}
