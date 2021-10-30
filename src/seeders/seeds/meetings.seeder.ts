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
      name: 'Meetballs Annual Eating Contest',
      description:
        'Pellentesque vestibulum dolor in tortor scelerisque, eu laoreet felis mattis. Duis ac mauris a ligula scelerisque commodo in sit amet est. Proin ac semper neque. Integer a sagittis velit, ac finibus risus. Curabitur blandit, nulla ut scelerisque interdum, tortor elit tristique quam, eu tempus ipsum tortor eu neque. Cras molestie eget enim vitae fringilla. In eget nibh tristique nunc porttitor eleifend ut in felis. Nam egestas mauris in augue suscipit cursus. Vivamus eget ornare ante, finibus pulvinar justo. Fusce sit amet dapibus neque, non euismod massa. Nunc elementum purus pretium elit luctus finibus. Nunc eu augue quis purus posuere sollicitudin quis non eros. Curabitur rutrum faucibus ipsum non tristique. Maecenas mattis eget diam at gravida.',
      startedAt: new Date(),
      duration: 180000,
      host: user,
      meetingId: '123456',
      meetingPassword: '123456',
      joinUrl: 'https://zoom.us/',
      enableTranscription: true,
      agendaItems: [
        {
          position: 1,
          name: 'Commencement of category 1 eating contest.',
          description:
            'Integer egestas gravida gravida. Suspendisse potenti. Curabitur id accumsan velit. Nulla volutpat tellus et erat scelerisque tincidunt. Proin ac semper nunc. Quisque tempus elit ut sem laoreet, sed semper mauris imperdiet. Sed consequat bibendum elementum. Nullam scelerisque, mi vel malesuada blandit, mauris odio pulvinar leo, eu finibus nisl ligula ut massa.',

          expectedDuration: 120000,
          isCurrent: false,
        },
        {
          position: 0,
          name: 'Opening address by CEO of Meetballs Inc.',
          description:
            'Vestibulum vitae convallis diam. Sed molestie odio vitae urna sodales pellentesque. Suspendisse ipsum urna, accumsan in tincidunt vitae, sodales eleifend lacus. Nunc rutrum ultrices velit, at mollis lorem vestibulum et. Etiam venenatis sapien nisl, eget condimentum velit accumsan sed. Integer maximus molestie ante, in fringilla turpis vestibulum et.',

          expectedDuration: 60000,
          isCurrent: false,
        },
      ],
      participants: [
        {
          userName: 'Admin',
          userEmail: user.email,
          role: ParticipantRole.HOST,
        },
        {
          userName: 'Meetball 1',
          userEmail: 'meetball1@meetmail.com',
          role: ParticipantRole.CONFERENCE_MEMBER,
        },
        {
          userName: 'Meetball 2',
          userEmail: 'meetball2@meetmail.com',
          role: ParticipantRole.CO_HOST,
        },
      ],
    });
  }

  drop(): Promise<any> {
    console.log('> Dropping user');
    return this.userRepository.delete({});
  }
}
