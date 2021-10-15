import { IsString } from 'class-validator';

export class UploadResponse {
  @IsString()
  uploadUrl: string;

  @IsString()
  downloadUrl: string;
}
