import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';

export enum MeetingQueryType {
  ALL = 'all',
  UPCOMING = 'upcoming',
  PAST = 'past',
}

export enum MeetingOrderBy {
  ASCENDING = 'asc',
  DESCENDING = 'desc',
}

export class MultipleMeetingQuery {
  //================ FILTERS ===================

  /**
   * The type of meetings to query
   *
   * @default MeetingQueryType.ALL
   */
  @IsOptional()
  @IsEnum(MeetingQueryType)
  type?: MeetingQueryType = MeetingQueryType.ALL;

  //================ ORDERING ===================

  /**
   * The ordering type of the query by start time
   *
   * @default MeetingOrderBy.DESCENDING
   */
  @IsOptional()
  @IsEnum(MeetingOrderBy)
  orderBy?: MeetingOrderBy = MeetingOrderBy.DESCENDING;

  //================ PAGINATION ===================

  /**
   * The number of queries per page
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  limit?: number = 10;

  /**
   * The page number to query
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;
}
