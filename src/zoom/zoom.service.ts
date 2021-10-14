import { catchError, map, Observable } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import {
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ZoomUser } from '../shared/interface/zoom-user.interface';
import { ZoomMeetingDto } from './dtos/zoom-meeting.dto';
import { Meeting } from '../meetings/meeting.entity';
import { ZoomMeetingListDto } from './dtos/zoom-meeting-list.dto';
import { ZoomMeetingStatus } from '../shared/enum/zoom-meeting-status.enum';
import { ZoomMeetingOptionsDto } from './dtos/zoom-meeting-options.dto';
import { User } from '../users/user.entity';
import {
  ZoomDeauthorizePayload,
  ZoomDeauthorizeSubscriptionDto,
} from './dtos/zoom-subscriptions.dto';
import { ZoomConfigService } from './../config/zoom.config';

@Injectable()
export class ZoomService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly httpService: HttpService,
    private readonly zoomConfig: ZoomConfigService,
  ) {}

  getUser(zoomToken: string): Observable<ZoomUser> {
    return this.httpService
      .get(`v2/users/me`, {
        headers: {
          Authorization: `Bearer ${zoomToken}`,
        },
      })
      .pipe(
        map((res) => res.data as ZoomUser),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );
  }

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

  createFromZoomMeeting(
    meetingDetails: ZoomMeetingDto,
    requester: User,
    options: ZoomMeetingOptionsDto,
  ): Promise<Meeting> {
    if (requester.zoomId !== meetingDetails.host_id) {
      throw new ForbiddenException('User not meeting host');
    }

    const {
      uuid,
      topic,
      agenda,
      start_time,
      duration,
      id,
      join_url,
      password,
      status,
    } = meetingDetails;

    const meetingToCreate = this.meetingRepository.create({
      name: topic,
      description: agenda,
      startedAt: new Date(start_time),
      host: requester,
      duration: duration,
      meetingId: `${id}`,
      meetingPassword: password,
      type:
        status === 'started'
          ? ZoomMeetingStatus.STARTED
          : ZoomMeetingStatus.WAITING,
      joinUrl: join_url,
      zoomUuid: uuid,
      enableTranscription: options?.enableTranscription || false,
      participants: options?.participants || [],
      agendaItems: options.agendaItems || [],
    });
    return this.meetingRepository.save(meetingToCreate);
  }

  async deauthorizeUser(
    verificationToken: string,
    deauthorizeDetail: ZoomDeauthorizeSubscriptionDto,
  ) {
    const { payload, event } = deauthorizeDetail;

    if (verificationToken !== this.zoomConfig.verificationToken) {
      throw new UnauthorizedException('Invalid verification token');
    }

    if (event !== 'app_deauthorized') {
      throw new UnauthorizedException('Invalid subscription type');
    }

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
      }
    } else {
      console.log('Error: user not found in db');
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
}
