import { s3Config, S3ConfigService } from './s3.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig, AppConfigService } from './app.config';
import { databaseConfig, DatabaseConfigService } from './database.config';
import { jwtConfig, JwtConfigService } from './jwt.config';
import { SeederConfigService, seederConfig } from './seeder.config';
import validationSchema from './config.schema';
import { mailConfig, MailConfigService } from './mail.config';
import { ZoomConfigService, zoomConfig } from './zoom.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        seederConfig,
        mailConfig,
        zoomConfig,
        s3Config,
      ],
      validationSchema: validationSchema,
    }),
  ],
  providers: [
    AppConfigService,
    DatabaseConfigService,
    JwtConfigService,
    SeederConfigService,
    MailConfigService,
    ZoomConfigService,
    S3ConfigService,
  ],
  exports: [
    ConfigModule,
    AppConfigService,
    DatabaseConfigService,
    JwtConfigService,
    SeederConfigService,
    MailConfigService,
    ZoomConfigService,
    S3ConfigService,
  ],
})
export class AppConfigModule {}
