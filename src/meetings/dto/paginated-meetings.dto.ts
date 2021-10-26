import { Meeting } from 'src/meetings/meeting.entity';
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedMeetings {
  @ApiProperty({ type: [Meeting] })
  items: Meeting[];

  @ApiProperty()
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };

  @ApiProperty()
  links: {
    first: string;
    previous: string;
    next: string;
    last: string;
  };
}
