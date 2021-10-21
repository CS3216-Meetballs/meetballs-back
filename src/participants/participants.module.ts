import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from './participant.entity';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { MeetingSocketModule } from '../meeting-socket/meeting-socket.module';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';
import { AppConfigModule } from 'src/config/config.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([Participant]),
    MeetingSocketModule,
    PassportModule,
    JwtModule.register({}),
    MailModule,
    AppConfigModule,
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
