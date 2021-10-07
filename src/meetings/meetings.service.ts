import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { Meeting } from './meeting.entity';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private meetingRepository: Repository<Meeting>,
  ) {}

  public async findOneById(id: string): Promise<Meeting> {
    return this.meetingRepository.findOne({ id });
  }

  public async createMeeting(
    createMeetingDto: CreateMeetingDto,
    hostId: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const { participants, agendaItems, ...rest } = createMeetingDto;
    const meetingToCreate = this.meetingRepository.create({
      ...createMeetingDto,
      hostId,
    });
    return this.meetingRepository.save(meetingToCreate);
    // return meetingToCreate;
  }

  public async doesMeetingExist(meetingUuid: string): Promise<boolean> {
    return !!(await this.meetingRepository.findOne({ id: meetingUuid }));
  }
}
