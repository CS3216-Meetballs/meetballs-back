import { IsDefined, IsUUID } from 'class-validator';

export class ParticipantDto {
  @IsUUID()
  @IsDefined()
  participantId: string;
}
