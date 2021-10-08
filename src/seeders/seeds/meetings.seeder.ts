import { Meeting } from './../../meetings/meeting.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from 'src/users/user.entity';
import { ISeeder } from '../seeder.interface';
import { ParticipantRole } from 'src/shared/enum/participant-role.enum';

@Injectable()
export class MeetingsSeeder implements ISeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
  ) {}

  async seed(): Promise<any> {
    const user = await this.userRepository.findOne({
      email: `admin@email.com`,
    });
    const meetingId = '10c7e0a8-120b-45e0-a37f-be92170bfb8d';
    const meeting = await this.meetingRepository.findOne({ id: meetingId });
    if (meeting) {
      await this.meetingRepository.remove(meeting);
    }
    return this.meetingRepository.save({
      id: '10c7e0a8-120b-45e0-a37f-be92170bfb8d',
      name: 'Seeded meeting',
      description: 'Seeded meeting',
      startedAt: new Date(),
      duration: 60 * 60 * 1000,
      host: user,
      meetingId: '123456',
      startUrl: 'https://www.example.com',
      joinUrl: 'https://www.example.com',
      agendaItems: [
        {
          position: 0,
          name: 'item0',
          description: 'description0',
          expectedDuration: 30 * 60 * 1000,
        },
        {
          position: 1,
          name: 'item1',
          description: 'description1',
          expectedDuration: 30 * 60 * 1000,
        },
      ],
      participants: [
        {
          userEmail: user.email,
          role: ParticipantRole.ADMIN,
        },
        {
          userEmail: 'user1@email.com',
          role: ParticipantRole.ADMIN,
        },
      ],
    });
  }

  drop(): Promise<any> {
    console.log('> Dropping user');
    return this.userRepository.delete({});
  }
}
