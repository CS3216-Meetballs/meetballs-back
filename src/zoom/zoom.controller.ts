import { map, mergeMap, Observable, catchError } from 'rxjs';
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExcludeEndpoint,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { ZoomService } from './zoom.service';
import { Meeting } from '../meetings/meeting.entity';
import { User } from '../users/user.entity';

import { ZoomMeetingDto } from './dtos/zoom-meeting.dto';
import { MinZoomMeetingDto } from './dtos/zoom-meeting-list.dto';
import { ZoomDeauthorizeSubscriptionDto } from './dtos/zoom-deauthorization-event.dto';
import { ZoomMeetingOptionsDto } from './dtos/zoom-meeting-options.dto';

import { UseAuth, UseBearerAuth } from '../shared/decorators/auth.decorator';
import { AuthBearerToken } from '../shared/decorators/auth-header.decorator';
import { Usr } from '../shared/decorators/user.decorator';
import { ZoomJoinedSubscriptionDto } from './dtos/zoom-participant-event.dto';
import { ZoomRecordingSubscriptionDto } from './dtos/zoom-recording-event.dto';
import { ZoomSubscriptionGuard } from './guard/zoom-subscription.guard';

@ApiTags('Zoom Meetings')
@Controller('zoom')
export class ZoomController {
  constructor(private readonly zoomService: ZoomService) {}

  /**
   * Get list of upcoming zoom meetings
   */
  @UseBearerAuth()
  @Get('meetings')
  public getZoomMeetingList(
    @AuthBearerToken() token: string,
  ): Observable<MinZoomMeetingDto[]> {
    return this.zoomService
      .getUpcomingMeetings(token)
      .pipe(map((data) => data.meetings));
  }

  /**
   * Get more details on zoom meeting
   * (eg. password)
   */
  @ApiParam({
    name: 'meetingId',
    description: 'The numeric zoom meeting id (not uuid)',
  })
  @UseBearerAuth()
  @Get('meetings/:meetingId')
  public getZoomMeeting(
    @AuthBearerToken() token: string,
    @Param('meetingId', ParseIntPipe) meetingId: number,
  ): Observable<ZoomMeetingDto> {
    return this.zoomService.getMeeting(meetingId, token);
  }

  /**
   * Link zoom meeting to MeetBalls
   */
  @ApiParam({
    name: 'meetingId',
    description: 'The numeric zoom meeting id provided by GET (not uuid)',
  })
  @ApiBody({
    type: ZoomMeetingOptionsDto,
    description: 'Additional options (optional)',
  })
  @UseBearerAuth()
  @Post('meetings/:meetingId')
  public linkZoomMeeting(
    @Usr() requester: User,
    @AuthBearerToken() token: string,
    @Param('meetingId', ParseIntPipe) meetingId: number,
    @Body() options: ZoomMeetingOptionsDto,
  ): Observable<Meeting> {
    return this.zoomService.getMeeting(meetingId, token).pipe(
      mergeMap((meetingDetails) =>
        this.zoomService.createFromZoomMeeting(
          meetingDetails,
          requester,
          options,
        ),
      ),
      catchError((err) => {
        console.log('Create Meeting error:', err);
        throw new NotFoundException('Zoom meeting not found');
      }),
    );
  }

  /**
   * Deauthorize user
   */
  @ApiExcludeEndpoint()
  @UseAuth(ZoomSubscriptionGuard)
  @Post('deauthorize')
  public deauthorizeUser(
    @Body() deauthorizeDetail: ZoomDeauthorizeSubscriptionDto,
  ) {
    return this.zoomService.deauthorizeUser(deauthorizeDetail);
  }

  /**
   * Participant joined the meeting
   */
  @ApiExcludeEndpoint()
  @UseAuth(ZoomSubscriptionGuard)
  @Post('joined')
  public automateAttendance(@Body() joinDetails: ZoomJoinedSubscriptionDto) {
    return this.zoomService.participantJoined(joinDetails);
  }

  /**
   * Zoom recording completed
   */
  @ApiExcludeEndpoint()
  @UseAuth(ZoomSubscriptionGuard)
  @Post('recording')
  public recordingCompleted(
    @Body() recordingDetails: ZoomRecordingSubscriptionDto,
  ) {
    return this.zoomService.recordingCompleted(recordingDetails);
  }
}
