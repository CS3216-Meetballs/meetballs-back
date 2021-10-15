import { IsNotEmpty, IsString } from 'class-validator';

export class ReadRequestDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  uploaderId: string;
}
