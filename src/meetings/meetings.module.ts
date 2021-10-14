import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Meeting } from './meeting.entity';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { MeetingSocketModule } from '../meeting-socket/meeting-socket.module';
import { AuthModule } from '../auth/auth.module';
import { AgendaItem } from '../agenda-items/agenda-item.entity';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from 'src/config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting, AgendaItem]),
    AuthModule,
    MeetingSocketModule,
    JwtModule.register({}),
    AppConfigModule,
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
})
export class MeetingsModule {}
