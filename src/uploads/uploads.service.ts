import { Injectable, NotFoundException } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { PutObjectRequest } from 'aws-sdk/clients/s3';
import { InjectAwsService } from 'nest-aws-sdk';

import { S3ConfigService } from '../config/s3.config';
import { UploadResponse } from './dto/uploads-response.dto';

interface SignedUrlParams extends Omit<PutObjectRequest, 'Expires'> {
  Expires: number;
}

@Injectable()
export class UploadsService {
  private bucketName: string;

  constructor(
    @InjectAwsService(S3) private readonly s3: S3,
    config: S3ConfigService,
  ) {
    this.bucketName = config.bucketName;
  }

  public createUploadLink(
    meetingId: string,
    requesterId: string,
    filename: string,
    mimeType: string,
  ): UploadResponse {
    const key = `meetballs/${meetingId}/${requesterId}/${filename}`;

    return {
      uploadUrl: this.getWritableSignedUrl(key, mimeType),
      downloadUrl: this.getDownloadableSignedUrl(key),
    };
  }

  public createDownloadLink(
    meetingId: string,
    uploaderId: string,
    filename: string,
  ): string {
    const key = `meetballs/${meetingId}/${uploaderId}/${filename}`;

    if (this.doesFileExist(key)) {
      throw new NotFoundException('File not found');
    }
    return this.getDownloadableSignedUrl(key);
  }

  private doesFileExist(key: string): Promise<boolean> {
    return this.s3
      .headObject({
        Bucket: this.bucketName,
        Key: key,
      })
      .promise()
      .then(
        () => true,
        (err) => {
          if (err.code === 'NotFound') {
            return false;
          }
          throw err;
        },
      );
  }

  private getWritableSignedUrl(key: string, mimeType: string): string {
    return this.s3.getSignedUrl('putObject', this.createParams(key, mimeType));
  }

  private getDownloadableSignedUrl(key: string): string {
    return this.s3.getSignedUrl('getObject', this.createParams(key, undefined));
  }

  private createParams(Key: string, mimeType: string): SignedUrlParams {
    return {
      Bucket: this.bucketName,
      Expires: 300, // 5 minutes
      ContentType: mimeType,
      Key,
    };
  }
}
