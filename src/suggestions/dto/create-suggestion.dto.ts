import {
  IsDefined,
  IsEmail,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateSuggestionDto {
  @IsUUID()
  meetingId: string;

  @IsEmail()
  @IsDefined()
  userEmail: string;

  @IsString()
  userName: string;

  @IsString()
  @IsDefined()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsInt()
  @IsPositive()
  @IsDefined()
  expectedDuration: number;
}
