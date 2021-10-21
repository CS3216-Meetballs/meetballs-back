import { catchError, firstValueFrom, map, Observable } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { ZoomMeetingDto } from './dtos/zoom-meeting.dto';
import { ZoomMeetingListDto } from './dtos/zoom-meeting-list.dto';
import { ZoomDeauthorizePayload } from './dtos/zoom-deauthorization-event.dto';
import { ZoomJoinMeetingPayload } from './dtos/zoom-participant-event.dto';
import { ZoomRecordingMeetingPayload } from './dtos/zoom-recording-event.dto';

import { ParticipantRole } from '../shared/enum/participant-role.enum';
import { Participant } from '../participants/participant.entity';
import { ZoomConfigService } from './../config/zoom.config';
import { Meeting } from '../meetings/meeting.entity';
import { User } from '../users/user.entity';
import { ZoomSyncMeetingDto } from './dtos/zoom-sync-meeting-dto';

@Injectable()
export class ZoomService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    private readonly httpService: HttpService,
    private readonly zoomConfig: ZoomConfigService,
  ) {}

  getUpcomingMeetings(zoomToken: string): Observable<ZoomMeetingListDto> {
    return this.httpService
      .get(`v2/users/me/meetings`, {
        headers: {
          Authorization: `Bearer ${zoomToken}`,
        },
        params: {
          type: 'upcoming',
          page_size: 30,
        },
      })
      .pipe(
        map((res) => res.data as ZoomMeetingListDto),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );
  }

  getMeeting(meetingId: number, zoomToken: string): Observable<ZoomMeetingDto> {
    return this.httpService
      .get(`v2/meetings/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${zoomToken}`,
        },
      })
      .pipe(
        map((res) => res.data as ZoomMeetingDto),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );
  }

  async syncMeeting(
    zoomSyncMeetingDto: ZoomSyncMeetingDto,
    zoomToken: string,
  ): Promise<Meeting> {
    const { meetingId, zoomUuid, id } = zoomSyncMeetingDto;
    const meeting = await this.meetingRepository.findOne({
      id,
      meetingId,
      zoomUuid,
    });
    if (!meeting) {
      throw new NotFoundException('MeetBalls meeting not found');
    }
    let newZoomUuid = zoomUuid;
    try {
      const zoomMeeting = await firstValueFrom(
        this.getMeeting(+meetingId, zoomToken),
      );
      newZoomUuid = zoomMeeting.uuid;
      console.log(zoomMeeting.join_url === meeting.joinUrl);
    } catch (err) {
      const httpStatus = (err as HttpException).getStatus();
      if (httpStatus === 404) {
        newZoomUuid = null;
      } else {
        // rethrow
        throw err;
      }
    }
    if (newZoomUuid === zoomUuid) {
      return meeting;
    }
    const newMeeting = this.meetingRepository.create({
      ...meeting,
      zoomUuid: newZoomUuid,
    });
    await this.meetingRepository.save(newMeeting);
    return newMeeting;
  }

  async deauthorizeUser(payload: ZoomDeauthorizePayload) {
    const user = await this.userRepository.findOne({ zoomId: payload.user_id });
    if (user) {
      if (user.isEmailConfirmed) {
        // user has other account type
        // unlink from zoom
        user.zoomId = null;
        await this.userRepository.save(user);
        console.log('Unlinked zoom user');
      } else {
        // Delete account
        await this.userRepository.remove(user);
        console.log('Deleted zoom user');
        await this.meetingRepository.update(
          { hostId: IsNull(), zoomUuid: Not(IsNull()) },
          { zoomUuid: null },
        );
        console.log('Unlinked orphaned meetings');
      }
    } else {
      console.log('User already deleted');
    }

    return this.httpService
      .post(
        `oauth/data/compliance`,
        {
          client_id: this.zoomConfig.clientId,
          user_id: payload.user_id,
          account_id: payload.account_id,
          deauthorization_event_received: payload,
          compliance_completed: true,
        },
        {
          auth: {
            username: this.zoomConfig.clientId,
            password: this.zoomConfig.clientSecret,
          },
        },
      )
      .pipe(
        map((res) => res.data as ZoomDeauthorizePayload),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );
  }

  async participantJoined(
    payload: ZoomJoinMeetingPayload,
  ): Promise<Participant> {
    const { uuid, host_id, participant: joinedParticipant } = payload;
    const meeting = await this.meetingRepository.findOne({
      zoomUuid: uuid,
    });

    if (!meeting) {
      console.log('meeting not tracked by meetballs');
      return null;
    }

    const { email, user_name, join_time, id } = joinedParticipant;

    const currParticipant = await this.participantRepository.findOne({
      meetingId: meeting.id,
      userEmail: email,
    });
    if (currParticipant && currParticipant.timeJoined != null) {
      console.log('already marked as attended');
      return null;
    } else if (currParticipant) {
      console.log('Updated participant');
      return this.participantRepository.save({
        ...currParticipant,
        timeJoined: new Date(join_time),
      });
    } else {
      return this.participantRepository.save({
        meetingId: meeting.id,
        userEmail: email,
        userName: user_name,
        role:
          id === host_id
            ? ParticipantRole.ADMIN
            : ParticipantRole.CONFERENCE_MEMBER,
        timeJoined: new Date(join_time),
      });
    }
  }

  recordingCompleted(_payload: ZoomRecordingMeetingPayload) {
    console.log('Method not implemented.');
  }
}
