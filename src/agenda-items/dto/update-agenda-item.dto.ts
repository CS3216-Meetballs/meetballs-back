import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateAgendaItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
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

  @IsString()
  @IsOptional()
  speakerName: string;

  @IsString()
  @IsOptional()
  speakerId: string;

  @IsString()
  @IsOptional()
  speakerMaterials: string;
}
