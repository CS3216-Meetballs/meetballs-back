import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig, AppConfigService } from './app.config';
import { databaseConfig, DatabaseConfigService } from './database.config';
import { jwtConfig, JwtConfigService } from './jwt.config';
import { SeederConfigService, seederConfig } from './seeder.config';
import validationSchema from './config.schema';
import { mailConfig, MailConfigService } from './mail.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, databaseConfig, jwtConfig, seederConfig, mailConfig],
      validationSchema: validationSchema,
    }),
  ],
  providers: [
    AppConfigService,
    DatabaseConfigService,
    JwtConfigService,
    SeederConfigService,
    MailConfigService,
  ],
  exports: [
    ConfigModule,
    AppConfigService,
    DatabaseConfigService,
    JwtConfigService,
    SeederConfigService,
    MailConfigService,
  ],
})
export class AppConfigModule {}
