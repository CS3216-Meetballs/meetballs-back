import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiQuery } from '@nestjs/swagger';

import { UseAuth } from '../shared/decorators/auth.decorator';
import { UploadResponse } from './dto/uploads-response.dto';
import { UploadsService } from './uploads.service';
import { UploadRequestDto } from './dto/write-request.dto';
import { ReadRequestDto } from './dto/read-request.dto';
import { MeetingsService } from './../meetings/meetings.service';
import { Participant } from '../participants/participant.entity';
import { User } from '../users/user.entity';
import { AccessUser } from './../shared/decorators/participant.decorator';
import { AccessGuard } from './../participants/guard/access.guard';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(
    private uploadsService: UploadsService,
    private meetingsService: MeetingsService,
  ) {}

  /**
   * Gets a signed upload link for uploading files
   */
  @ApiQuery({ description: 'The file details', type: UploadRequestDto })
  @ApiOkResponse({
    description:
      'Successfully get the signed URL and image URL for uploading of cat image',
    type: UploadResponse,
  })
  @UseAuth(AccessGuard)
  @Get('/write/:meetingUuid')
  async getUploadLink(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('meetingUuid') meetingId: string,
    @Query() uploadRequest: UploadRequestDto,
  ): Promise<UploadResponse> {
    if (
      userOrParticipant['meetingId'] &&
      (userOrParticipant as Participant).meetingId !== meetingId
    ) {
      throw new ForbiddenException('Not part of meeting');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to write');
    }

    return this.uploadsService.createUploadLink(
      meetingId,
      uploadRequest.uploader,
      uploadRequest.name,
      uploadRequest.type,
    );
  }

  /**
   * Gets a signed download link for file
   */
  @ApiQuery({ description: 'The file details', type: ReadRequestDto })
  @ApiOkResponse({
    description: 'The url for read access',
  })
  @UseAuth(AccessGuard)
  @Get('/read/:meetingUuid')
  async getDownloadLink(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('meetingUuid') meetingId: string,
    @Query() readRequest: ReadRequestDto,
  ): Promise<string> {
    if (
      userOrParticipant['meetingId'] &&
      (userOrParticipant as Participant).meetingId !== meetingId
    ) {
      throw new ForbiddenException('Not part of meeting');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to read meeting');
    }

    return this.uploadsService.createDownloadLink(
      meetingId,
      readRequest.uploader,
      readRequest.name,
    );
  }

  /**
   * Deletes the file from s3
   */
  @ApiQuery({ description: 'The file details', type: ReadRequestDto })
  @UseAuth(AccessGuard)
  @Delete('/:meetingUuid')
  async deleteFile(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('meetingUuid') meetingId: string,
    @Query() readRequest: ReadRequestDto,
  ) {
    if (
      userOrParticipant['meetingId'] &&
      (userOrParticipant as Participant).meetingId !== meetingId
    ) {
      throw new ForbiddenException('Not part of meeting');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to delete');
    }

    await this.uploadsService.deleteFile(
      meetingId,
      readRequest.uploader,
      readRequest.name,
    );
    return;
  }
}
