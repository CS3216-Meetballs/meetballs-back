import { IsInt, IsOptional, IsPositive, IsString, Max } from 'class-validator';

export class CreateFeedbackDto {
  @IsInt()
  @IsPositive()
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  meetingId: string;
}
