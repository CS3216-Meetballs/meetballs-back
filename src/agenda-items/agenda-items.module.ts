import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaItem } from './agenda-item.entity';
import { AgendaItemsController } from './agenda-items.controller';
import { AgendaItemsService } from './agenda-items.service';
import { MeetingSocketModule } from '../meeting-socket/meeting-socket.module';

@Module({
  imports: [TypeOrmModule.forFeature([AgendaItem]), MeetingSocketModule],
  controllers: [AgendaItemsController],
  providers: [AgendaItemsService],
  exports: [AgendaItemsService],
})
export class AgendaItemsModule {}
