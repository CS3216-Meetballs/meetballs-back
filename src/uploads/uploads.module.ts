import { Module } from '@nestjs/common';
import { AwsSdkModule } from 'nest-aws-sdk';
import { S3 } from 'aws-sdk';

import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { S3ConfigService } from '../config/s3.config';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [AwsSdkModule.forFeatures([S3]), AppConfigModule],
  providers: [UploadsService, S3ConfigService],
  controllers: [UploadsController],
})
export class UploadsModule {}
