import { Body, Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiBody } from '@nestjs/swagger';

import { UseBearerAuth } from '../shared/decorators/auth.decorator';
import { UploadResponse } from './dto/uploads-response.dto';
import { UploadsService } from './uploads.service';
import { UploadRequestDto } from './dto/write-request.dto';
import { User } from '../users/user.entity';
import { Usr } from '../shared/decorators/user.decorator';
import { ReadRequestDto } from './dto/read-request.dto';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  /**
   * Gets a signed upload link for uploading files
   */
  @ApiBody({ description: 'The file details', type: UploadRequestDto })
  @ApiOkResponse({
    description:
      'Successfully get the signed URL and image URL for uploading of cat image',
    type: UploadResponse,
  })
  @UseBearerAuth()
  @Get('/write/:meetingUuid')
  getUploadLink(
    @Usr() requester: User,
    @Param('meetingUuid') meetingId: string,
    @Body() uploadRequest: UploadRequestDto,
  ): UploadResponse {
    return this.uploadsService.createUploadLink(
      meetingId,
      requester.uuid,
      uploadRequest.fileName,
      uploadRequest.mimeType,
    );
  }

  /**
   * Gets a signed download link for file
   */
  @ApiBody({ description: 'The file details', type: ReadRequestDto })
  @ApiOkResponse({
    description: 'The url for read access',
  })
  @Get('/read/:meetingUuid')
  createCatUploadLink(
    @Param('meetingUuid') meetingId: string,
    @Body() readRequest: ReadRequestDto,
  ): string {
    return this.uploadsService.createDownloadLink(
      meetingId,
      readRequest.uploaderId,
      readRequest.filename,
    );
  }
}
