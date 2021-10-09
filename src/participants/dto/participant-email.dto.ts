import { IsDefined, IsEmail } from 'class-validator';

export class ParticipantEmailDto {
  @IsEmail()
  @IsDefined()
  email: string;
}
