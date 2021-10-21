import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateSuggestionDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  expectedDuration: number;
}
