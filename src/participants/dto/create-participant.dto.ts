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
  meetingId: string;

  @IsEmail()
  @IsDefined()
  userEmail: string;

  @IsOptional()
  @IsEnum(ParticipantRole)
  role: number;
}
