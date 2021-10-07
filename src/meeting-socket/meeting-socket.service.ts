import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Meeting } from '../meetings/meeting.entity';

@Injectable()
export class MeetingSocketService {
  constructor(
    @InjectRepository(Meeting)
    private meetingRepository: Repository<Meeting>,
  ) {}

  public async doesMeetingExist(meetingUuid: string): Promise<boolean> {
    return !!(await this.meetingRepository.findOne({ id: meetingUuid }));
  }
}
