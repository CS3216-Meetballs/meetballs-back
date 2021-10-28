import { Meeting } from 'src/meetings/meeting.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MeetingSocketService {
  constructor(
    @InjectRepository(Meeting)
    private meetingRepository: Repository<Meeting>,
  ) {}

  getMeeting(id: string) {
    return this.meetingRepository.findOne({ id });
  }
}
