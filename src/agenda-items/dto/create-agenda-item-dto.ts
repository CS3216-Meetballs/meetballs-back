import {
  IsDefined,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateAgendaItemDto {
  @IsString()
  @IsOptional() // No need if it is created when create a meeting.
  meetingId?: string;

  @IsInt()
  @Min(0)
  @IsDefined()
  position: number;

  @IsString()
  @IsDefined()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsPositive()
  @IsDefined()
  expectedDuration: number;
}