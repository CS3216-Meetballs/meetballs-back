import {
  IsDefined,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ParticipantRole } from '../../shared/enum/participant-role.enum';

export class CreateParticipantDto {
  @IsString()
  @IsOptional() // No need if it is created when create a meeting.
  meetingId?: string;

  @IsEmail()
  @IsDefined()
  userEmail: string;

  @IsOptional()
  @IsEnum(ParticipantRole)
  role: number;
}
