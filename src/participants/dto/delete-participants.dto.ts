import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsEmail,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class DeleteParticipant {
  @IsEmail()
  @IsDefined()
  userEmail: string;
}

export class DeleteParticipantsDto {
  @IsUUID()
  @IsDefined()
  meetingId: string;

  @IsArray()
  @Type(() => DeleteParticipant)
  @ValidateNested({ each: true })
  @IsDefined()
  @ArrayMinSize(1) // If items are reordered, at least 2 items need to be swapped
  @ApiProperty({
    description: 'List participants to be deleted',
    type: [DeleteParticipant],
  })
  participants: DeleteParticipant[];
}
