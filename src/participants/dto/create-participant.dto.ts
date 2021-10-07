import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsEmail,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ParticipantRole } from '../../shared/enum/participant-role.enum';

export class CreateParticipantDto {
  @IsUUID()
  @IsOptional() // No need if it is created when create a meeting.
  meetingId?: string;

  @IsEmail()
  @IsDefined()
  userEmail: string;

  @IsOptional()
  @ApiProperty({
    enum: ParticipantRole,
    description: 'CONFERENCE_MEMBER=1, ADMIN=2',
  })
  @IsEnum(ParticipantRole)
  role?: number;
}

export class CreateParticipantsDto {
  @IsArray()
  @Type(() => CreateParticipantDto)
  @ValidateNested({ each: true })
  @IsDefined()
  @ArrayMinSize(1) // If items are reordered, at least 2 items need to be swapped
  @ApiProperty({
    description: 'List participants to be created',
    type: [CreateParticipantDto],
  })
  participants: CreateParticipantDto[];
}
