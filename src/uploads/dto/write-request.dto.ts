import { IsNotEmpty, IsString } from 'class-validator';

export class UploadRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  uploader: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}
