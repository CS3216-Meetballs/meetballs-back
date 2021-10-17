import { IsNotEmpty, IsString } from 'class-validator';

export class ReadRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  uploader: string;
}
