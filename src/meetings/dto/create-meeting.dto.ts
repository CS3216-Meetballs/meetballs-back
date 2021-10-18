import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { isNil } from 'lodash';
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

  @IsDate()
  @Type(() => Date)
  startedAt: Date;

  @IsInt()
  @IsPositive()
  duration: number;

  @IsNumberString()
  @IsDefined()
  meetingId: string;

  @IsString()
  @IsDefined()
  meetingPassword: string;

  @IsString()
  @IsUrl()
  @IsDefined()
  joinUrl: string;

  @IsOptional()
  @IsBoolean()
  enableTranscription: boolean;

  @IsOptional()
  @IsString()
  zoomUuid: string;

  @ValidateIf((obj) => !isNil(obj.participants))
  @IsArray()
  @Type(() => CreateParticipantMinimalDto)
  @IsDefined()
  @ValidateNested({ each: true })
  @ApiProperty({
    description: 'List of participants for the meeting',
    type: [CreateParticipantMinimalDto],
  })
  participants: CreateParticipantMinimalDto[];

  @ValidateIf((obj) => !isNil(obj.agendaItems))
  @IsArray()
  @Type(() => CreateAgendaItemMinimalDto)
  @IsDefined()
  @ValidateNested({ each: true })
  @ApiProperty({
    description: 'List of agenda items for the meeting',
    type: [CreateAgendaItemMinimalDto],
  })
  agendaItems: CreateAgendaItemMinimalDto[];
}
