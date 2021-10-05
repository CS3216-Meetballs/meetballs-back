import { IsString } from 'class-validator';

export class ChangeNameDto {
  @IsString()
  firstName?: string;

  @IsString()
  lastName?: string;
}
