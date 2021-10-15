import { IsNotEmpty, IsString } from 'class-validator';

export class UploadRequestDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;
}
