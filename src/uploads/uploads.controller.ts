import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiQuery } from '@nestjs/swagger';

import { UseBearerAuth } from '../shared/decorators/auth.decorator';
import { UploadResponse } from './dto/uploads-response.dto';
import { UploadsService } from './uploads.service';
import { UploadRequestDto } from './dto/write-request.dto';
import { ReadRequestDto } from './dto/read-request.dto';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  /**
   * Gets a signed upload link for uploading files
   */
  @ApiQuery({ description: 'The file details', type: UploadRequestDto })
  @ApiOkResponse({
    description:
      'Successfully get the signed URL and image URL for uploading of cat image',
    type: UploadResponse,
  })
  @UseBearerAuth()
  @Get('/write/:meetingUuid')
  getUploadLink(
    @Param('meetingUuid') meetingId: string,
    @Query() uploadRequest: UploadRequestDto,
  ): UploadResponse {
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
  @Get('/read/:meetingUuid')
  getDownloadLink(
    @Param('meetingUuid') meetingId: string,
    @Query() readRequest: ReadRequestDto,
  ): Promise<string> {
    return this.uploadsService.createDownloadLink(
      meetingId,
      readRequest.uploader,
      readRequest.name,
    );
  }
}
