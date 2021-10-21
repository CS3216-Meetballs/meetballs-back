import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';
import { AppConfigModule } from 'src/config/config.module';
import { PassportModule } from '@nestjs/passport';
import { Suggestion } from './suggestion.entity';
import { SuggestionsController } from './suggestions.controller';
import { SuggestionsService } from './suggestions.service';
import { AgendaItemsModule } from 'src/agenda-items/agenda-items.module';
import { MeetingsModule } from 'src/meetings/meetings.module';
import { ParticipantsModule } from 'src/participants/participants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Suggestion]),
    PassportModule,
    JwtModule.register({}),
    MailModule,
    AppConfigModule,
    MeetingsModule,
    AgendaItemsModule,
    ParticipantsModule,
  ],
  controllers: [SuggestionsController],
  providers: [SuggestionsService],
})
export class SuggestionsModule {}
