import {
  IsDefined,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateSuggestionDto {
  @IsUUID()
  meetingId: string;

  @IsString()
  @IsDefined()
  name: string;

  @IsUUID()
  @IsOptional()
  speakerId: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsInt()
  @IsPositive()
  @IsDefined()
  expectedDuration: number;
}
