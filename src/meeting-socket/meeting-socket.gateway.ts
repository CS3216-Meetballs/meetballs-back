import { ParticipantRole } from 'src/shared/enum/participant-role.enum';
import { MeetingSocketService } from './meeting-socket.service';
import { Suggestion } from 'src/suggestions/suggestion.entity';
import { Participant } from './../participants/participant.entity';
import { AuthService } from '../auth/auth.service';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { plainToClass } from 'class-transformer';
import { Server, Socket } from 'socket.io';
import { Meeting } from '../meetings/meeting.entity';

@WebSocketGateway({ namespace: 'meeting', cors: true })
export class MeetingSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private authService: AuthService,
    private meetingSocketService: MeetingSocketService,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const id = client.handshake.auth.meetingId as string;
    const accessToken = client.handshake.auth.token as string;
    const participantToken = client.handshake.auth.participant as string;
    let meeting: Meeting;
    try {
      meeting = await this.meetingSocketService.getMeeting(id);
    } catch (err) {
      return false;
    }
    if (!meeting) {
      return false;
    }
    const user = accessToken
      ? await this.authService.getUserFromToken(accessToken)
      : null;

    const participant = participantToken
      ? await this.authService.getParticipantFromToken(participantToken)
      : null;

    if (!participant && !user) {
      return false;
    }

    if (
      user?.uuid === meeting?.hostId ||
      participant.role === ParticipantRole.CO_HOST
    ) {
      client.join(`${id}_host`);
    } else {
      client.join(id);
    }
    client
      .to([id, `${id}_host`])
      .emit('userConnected', user?.firstName || participant?.userName);
    // console.log(`${user?.firstName || participant?.userName} connected`);
    return true;
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  emitMeetingUpdated(meetingId: string, meeting: Meeting) {
    this.server
      .to(`${meetingId}_host`)
      .emit(
        'meetingUpdated',
        JSON.stringify(
          plainToClass(Meeting, meeting, { groups: ['role:host'] }),
        ),
      );

    return this.server
      .to(meetingId)
      .emit(
        'meetingUpdated',
        JSON.stringify(plainToClass(Meeting, meeting, { groups: [] })),
      );
  }

  emitMeetingDeleted(meetingId: string) {
    this.server
      .to([meetingId, `${meetingId}_host`])
      .emit('meetingDeleted', 'Closing connection in 5');
    setTimeout(
      () => this.server.to(meetingId).disconnectSockets(true),
      5 * 1000,
    );
  }

  emitSuggestionsUpdated(meetingId: string, suggestion: Suggestion) {
    return this.server
      .to([meetingId, `${meetingId}_host`])
      .emit('suggestionUpdated', JSON.stringify(suggestion));
  }

  emitSuggestionsDeleted(meetingId: string, suggestionId: string) {
    return this.server
      .to([meetingId, `${meetingId}_host`])
      .emit('suggestionDeleted', suggestionId);
  }

  emitParticipantsUpdated(meetingId: string, participant: Participant) {
    this.server
      .to(`${meetingId}_host`)
      .emit(
        'participantUpdated',
        JSON.stringify(
          plainToClass(Participant, participant, { groups: ['role:host'] }),
        ),
      );

    const { userEmail: _, ...filteredParticipant } = participant;
    return this.server
      .to(meetingId)
      .emit(
        'participantUpdated',
        JSON.stringify(
          plainToClass(Participant, filteredParticipant, { groups: [] }),
        ),
      );
  }

  emitParticipantsDeleted(meetingId: string, participantId: string) {
    return this.server
      .to([meetingId, `${meetingId}_host`])
      .emit('participantDeleted', participantId);
  }

  emitAgendaUpdated(meetingId: string) {
    return this.server
      .to([meetingId, `${meetingId}_host`])
      .emit('agendaUpdated');
  }
}
