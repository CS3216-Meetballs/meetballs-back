import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class AgendaItemPosition {
  @IsInt()
  @Min(0)
  @IsDefined()
  oldPosition: number;

  @IsInt()
  @Min(0)
  @IsDefined()
  newPosition: number;
}

export class UpdateAgendaItemsPositionDto {
  @IsString()
  @IsDefined()
  meetingId: string;

  @IsArray()
  @Type(() => AgendaItemPosition)
  @ValidateNested({ each: true })
  @IsDefined()
  @ArrayMinSize(2) // If items are reordered, at least 2 items need to be swapped
  @ApiProperty({
    description: 'List of old and new positions of the agenda items',
    type: [AgendaItemPosition],
  })
  positions: AgendaItemPosition[];
}
