import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaItemsModule } from '../agenda-items/agenda-items.module';
import { ParticipantsModule } from '../participants/participants.module';
import { Meeting } from './meeting.entity';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting]),
    ParticipantsModule,
    AgendaItemsModule,
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
