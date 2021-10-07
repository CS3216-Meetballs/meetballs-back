import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

// Does not include position
export class UpdateAgendaItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @IsOptional()
  startTime?: Date;

  @IsInt()
  @IsPositive()
  @IsOptional()
  expectedDuration?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  actualDuration?: number;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;
}
