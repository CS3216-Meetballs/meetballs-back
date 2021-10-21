import { map, Observable } from 'rxjs';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ZoomService } from './zoom.service';

import { ZoomMeetingDto } from './dtos/zoom-meeting.dto';
import { MinZoomMeetingDto } from './dtos/zoom-meeting-list.dto';
import { ZoomDeauthorizeSubscriptionDto } from './dtos/zoom-deauthorization-event.dto';
import { ZoomJoinedSubscriptionDto } from './dtos/zoom-participant-event.dto';
import { ZoomRecordingSubscriptionDto } from './dtos/zoom-recording-event.dto';

import { UseAuth, UseBearerAuth } from '../shared/decorators/auth.decorator';
import { AuthBearerToken } from '../shared/decorators/auth-header.decorator';
import { ZoomSubscriptionGuard } from './guard/zoom-subscription.guard';
import { MeetingSocketGateway } from '../meeting-socket/meeting-socket.gateway';
import { ZoomSyncMeetingDto } from './dtos/zoom-sync-meeting-dto';

@ApiTags('Zoom Meetings')
@Controller('zoom')
export class ZoomController {
  constructor(
    private readonly zoomService: ZoomService,
    private readonly meetingGateway: MeetingSocketGateway,
  ) {}

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
   * Checks meeting uuid to see if it is updated
   *
   * Returns the current valid meeting uuid, null otherwise
   */
  @ApiResponse({ description: 'The synced meeting' })
  @UseBearerAuth()
  @Post('meetings/sync')
  public async syncMeetingWithZoom(
    @AuthBearerToken() token: string,
    @Body() zoomSyncMeetingDto: ZoomSyncMeetingDto,
  ): Promise<string | null> {
    const meeting = await this.zoomService.syncMeeting(
      zoomSyncMeetingDto,
      token,
    );

    if (meeting.zoomUuid !== zoomSyncMeetingDto.zoomUuid) {
      return meeting.zoomUuid;
    }

    return zoomSyncMeetingDto.zoomUuid;
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
    const { payload, event } = deauthorizeDetail;

    if (event !== 'app_deauthorized') {
      throw new ForbiddenException('Invalid subscription type');
    }
    this.zoomService.deauthorizeUser(payload);
    return true;
  }

  /**
   * Participant joined the meeting
   */
  @ApiExcludeEndpoint()
  @UseAuth(ZoomSubscriptionGuard)
  @Post('joined')
  public automateAttendance(@Body() joinDetails: ZoomJoinedSubscriptionDto) {
    const { payload, event } = joinDetails;
    console.log(joinDetails);

    if (event !== 'meeting.participant_joined') {
      throw new ForbiddenException('Invalid subscription type');
    }
    this.zoomService.participantJoined(payload.object).then((participant) => {
      if (participant) {
        return this.meetingGateway.emitParticipantsUpdated(
          participant.meetingId,
          participant,
        );
      }
    });
    return true;
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
    const { payload, event } = recordingDetails;
    console.log(recordingDetails);

    if (event !== 'recording.completed') {
      throw new ForbiddenException('Invalid subscription type');
    }

    this.zoomService.recordingCompleted(payload.object);
    return true;
  }
}
