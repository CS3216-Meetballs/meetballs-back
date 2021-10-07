import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsDefined,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ParticipantRole } from '../../shared/enum/participant-role.enum';

class UpdateParticipant {
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

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  timeJoined?: Date;
}

export class UpdateParticipantsDto {
  @IsUUID()
  @IsDefined()
  meetingId: string;

  @IsArray()
  @Type(() => UpdateParticipant)
  @ValidateNested({ each: true })
  @IsDefined()
  @ArrayMinSize(1) // If items are reordered, at least 2 items need to be swapped
  @ApiProperty({
    description: 'List participants to be updated',
    type: [UpdateParticipant],
  })
  participants: UpdateParticipant[];
}
