import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from './participant.entity';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { MeetingSocketModule } from '../meeting-socket/meeting-socket.module';

@Module({
  imports: [TypeOrmModule.forFeature([Participant]), MeetingSocketModule],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
})
export class ParticipantsModule {}
