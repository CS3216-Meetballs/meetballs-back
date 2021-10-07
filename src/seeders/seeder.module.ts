import { MeetingsSeeder } from './seeds/meetings.seeder';
import { Meeting } from './../meetings/meeting.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from 'src/config/config.module';
import { SeederConfigService } from 'src/config/seeder.config';
import { User } from 'src/users/user.entity';
import { ISeeder } from './seeder.interface';
import { SeederService } from './seeder.service';
import { UsersSeeder } from './seeds/users.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([User, Meeting]), AppConfigModule],
  providers: [
    SeederConfigService,
    { provide: ISeeder, useClass: UsersSeeder },
    UsersSeeder,
    MeetingsSeeder,
    {
      provide: SeederService,
      useFactory: (
        seederConfigService: SeederConfigService,
        ...seeders: ISeeder[]
      ): SeederService => new SeederService(seederConfigService, seeders),
      inject: [SeederConfigService, UsersSeeder, MeetingsSeeder],
    },
  ],
})
export class SeederModule {}
