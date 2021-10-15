import { UploadsModule } from './uploads/uploads.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { DatabaseConfigService } from './config/database.config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MeetingsModule } from './meetings/meetings.module';
import { AgendaItemsModule } from './agenda-items/agenda-items.module';
import { ParticipantsModule } from './participants/participants.module';
import { SeederModule } from './seeders/seeder.module';
import { MeetingSocketModule } from './meeting-socket/meeting-socket.module';
import { ZoomModule } from './zoom/zoom.module';
import { FeedbacksModule } from './feedback/feedbacks.module';
import { AwsSdkModule } from 'nest-aws-sdk';
import { S3 } from 'aws-sdk';
import { S3ConfigService } from './config/s3.config';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      useClass: DatabaseConfigService,
    }),
    UsersModule,
    AuthModule,
    MeetingsModule,
    MeetingSocketModule,
    AgendaItemsModule,
    ParticipantsModule,
    SeederModule,
    ZoomModule,
    FeedbacksModule,
    AwsSdkModule.forRootAsync({
      defaultServiceOptions: {
        useFactory: ({ values }: S3ConfigService) => ({
          ...values,
          s3ForcePathStyle: true,
        }),
        imports: [AppConfigModule],
        inject: [S3ConfigService],
      },
      services: [S3],
    }),
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
