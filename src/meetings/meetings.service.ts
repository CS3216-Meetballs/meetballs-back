import { AgendaItem } from './../agenda-items/agenda-item.entity';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Any, FindConditions, Repository } from 'typeorm';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { Meeting } from './meeting.entity';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { ZoomMeetingStatus } from '../shared/enum/zoom-meeting-status.enum';
import { isArray } from 'lodash';
import { GenerateParticipantMagicLinkPayload } from 'src/shared/interface/generate-participant-magic-link.interface';
import { JwtService } from '@nestjs/jwt';
import { JwtConfigService } from 'src/config/jwt.config';
import { Participant } from 'src/participants/participant.entity';
import { GetMeetingViaMagicLinkDto } from './dto/get-meeting-via-magic-link-response.dto';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(AgendaItem)
    private readonly agendaRepository: Repository<AgendaItem>,
    private readonly jwtService: JwtService,
    private readonly jwtConfigService: JwtConfigService,
  ) {}

  public async findMultiple(
    type: string,
    requesterId: string,
  ): Promise<Meeting[]> {
    const findCondition: FindConditions<Meeting> =
      type === 'past'
        ? {
            hostId: requesterId,
            type: ZoomMeetingStatus.ENDED,
          }
        : type === 'all'
        ? {
            hostId: requesterId,
          }
        : {
            // default type is upcoming
            hostId: requesterId,
            type: Any([ZoomMeetingStatus.WAITING, ZoomMeetingStatus.STARTED]),
          };
    return this.meetingRepository.find(findCondition);
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

  public async createMeeting(
    createMeetingDto: CreateMeetingDto,
    hostId: string,
  ) {
    const meetingToCreate = this.meetingRepository.create({
      ...createMeetingDto,
      hostId,
    });
    const createdMeeting = await this.meetingRepository.save(meetingToCreate);
    return this.findOneById(createdMeeting.id, true);
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
      throw new UnauthorizedException('Cannot modify meeting');
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
      throw new UnauthorizedException('Cannot delete meeting');
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
      throw new UnauthorizedException('Cannot start meeting');
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
      throw new UnauthorizedException('Cannot move to next meeting item');
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
      throw new UnauthorizedException('Cannot end meeting');
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

  public async getMeetingViaMagicLink(
    token: string,
  ): Promise<GetMeetingViaMagicLinkDto> {
    let payload: GenerateParticipantMagicLinkPayload;
    try {
      payload = this.jwtService.verify<GenerateParticipantMagicLinkPayload>(
        token,
        {
          ignoreExpiration: false,
          secret: this.jwtConfigService.magicLinkTokenOptions.secret,
        },
      );
    } catch (error) {
      throw new BadRequestException('Invalid token/ Meeting has ended');
    }
    const { meetingId, userName, userEmail } = payload;
    const meeting = await this.findOneById(meetingId, true);
    if (!meeting) {
      // Should not happen but just in case
      throw new InternalServerErrorException('Meeting not found');
    }
    const joiner: Participant = meeting.participants.find(
      (participant) =>
        participant.userEmail === userEmail &&
        participant.userName === userName,
    );
    console.log('JOINER', joiner);
    if (!joiner) {
      throw new InternalServerErrorException('Participant not found');
    }
    console.log(joiner);
    const isMatch = token === joiner.hashedMagicLinkToken;
    // Somehow this is always true even when payload changes??
    // const isMatch = await bcrypt.compare(
    //   token,
    //   joiner.hashedMagicLinkToken ?? '',
    // );
    if (!isMatch) {
      throw new BadRequestException(
        'Invalid link, please use the link from your latest invitation',
      );
    }
    return {
      meeting,
      joiner,
    };
  }
}
