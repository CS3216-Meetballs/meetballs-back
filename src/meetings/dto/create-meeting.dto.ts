import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { CreateAgendaItemDto } from '../../agenda-items/dto/create-agenda-item.dto';
import { CreateParticipantDto } from '../../participants/dto/create-participant.dto';

export class CreateParticipantMinimalDto extends OmitType(
  CreateParticipantDto,
  ['meetingId'],
) {}

export class CreateAgendaItemMinimalDto extends OmitType(CreateAgendaItemDto, [
  'meetingId',
]) {}

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
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

  @IsArray()
  @Type(() => CreateParticipantMinimalDto)
  @IsDefined()
  @ValidateNested({ each: true })
  @ArrayMinSize(1) // should at least contain the 1 participant (the host)
  @ApiProperty({
    description: 'List of participants for the meeting',
    type: [CreateParticipantMinimalDto],
  })
  participants: CreateParticipantMinimalDto[];

  @IsArray()
  @Type(() => CreateAgendaItemMinimalDto)
  @IsDefined()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ApiProperty({
    description: 'List of agenda items for the meeting',
    type: [CreateAgendaItemMinimalDto],
  })
  agendaItems: CreateAgendaItemMinimalDto[];
}
