import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingsModule } from 'src/meetings/meetings.module';
import { AgendaItem } from './agenda-item.entity';
import { AgendaItemsController } from './agenda-items.controller';
import { AgendaItemsService } from './agenda-items.service';

@Module({
  imports: [TypeOrmModule.forFeature([AgendaItem]), MeetingsModule],
  controllers: [AgendaItemsController],
  providers: [AgendaItemsService],
})
export class AgendaItemsModule {}
