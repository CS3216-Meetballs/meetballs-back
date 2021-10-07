import { MeetingSocketService } from './meeting-socket.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingSocketGateway } from './meeting-socket.gateway';
import { Meeting } from '../meetings/meeting.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting]), AuthModule],
  providers: [MeetingSocketGateway, MeetingSocketService],
  exports: [MeetingSocketGateway],
})
export class MeetingSocketModule {}
