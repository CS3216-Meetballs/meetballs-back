import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';
import { AppConfigModule } from 'src/config/config.module';
import { PassportModule } from '@nestjs/passport';
import { Suggestion } from './suggestion.entity';
import { SuggestionsController } from './suggestions.controller';
import { SuggestionsService } from './suggestions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Suggestion]),
    PassportModule,
    JwtModule.register({}),
    MailModule,
    AppConfigModule,
  ],
  controllers: [SuggestionsController],
  providers: [SuggestionsService],
})
export class SuggestionsModule {}
