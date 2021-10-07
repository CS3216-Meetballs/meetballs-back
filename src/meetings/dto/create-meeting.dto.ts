import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { CreateAgendaItemDto } from '../../agenda-items/dto/create-agenda-item-dto';
import { CreateParticipantDto } from '../../participants/dto/create-participant-dto';

export class CreateMeetingDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsInt()
  @IsPositive()
  duration: number;

  // hostId should be the user's id
  // get from requester
  @IsString()
  @IsDefined()
  meetingId: string;

  @IsString()
  @IsUrl()
  @IsDefined()
  startUrl: string;

  @IsString()
  @IsUrl()
  @IsDefined()
  joinUrl: string;

  @IsOptional()
  @IsBoolean()
  enableTranscription: boolean;

  @IsString()
  @IsUrl()
  @IsDefined()
  videoUrl: string;

  @IsArray()
  @Type(() => CreateParticipantDto)
  @IsDefined()
  @ValidateNested({ each: true })
  @ArrayMinSize(1) // should at least contain the 1 participant (the host)
  @ApiProperty({
    description: 'List of participants for the meeting',
    type: [CreateParticipantDto],
  })
  participants: CreateParticipantDto[];

  @IsArray()
  @Type(() => CreateAgendaItemDto)
  @IsDefined()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ApiProperty({
    description: 'List of agenda items for the meeting',
    type: [CreateAgendaItemDto],
  })
  agendaItems: CreateAgendaItemDto[];
}
