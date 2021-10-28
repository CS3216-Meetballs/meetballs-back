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
import { classToPlain } from 'class-transformer';
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

    const rooms = [id];
    if (user?.uuid === meeting?.hostId) {
      rooms.push(`${id}_host`);
    }
    client.join(rooms);
    client
      .to(id)
      .emit('userConnected', user?.firstName || participant?.userName);
    // console.log(`${user?.firstName || participant?.userName} connected`);
    return true;
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  emitMeetingUpdated(meetingId: string, meeting: Meeting) {
    return this.server
      .to(meetingId)
      .emit('meetingUpdated', JSON.stringify(classToPlain(meeting)));
  }

  emitMeetingDeleted(meetingId: string) {
    this.server.to(meetingId).emit('meetingDeleted', 'Closing connection in 5');
    setTimeout(
      () => this.server.to(meetingId).disconnectSockets(true),
      5 * 1000,
    );
  }

  emitSuggestionsUpdated(meetingId: string, suggestion: Suggestion) {
    return this.server
      .to(meetingId)
      .emit('suggestionUpdated', JSON.stringify(classToPlain(suggestion)));
  }

  emitSuggestionsDeleted(meetingId: string, suggestionId: string) {
    return this.server.to(meetingId).emit('suggestionDeleted', suggestionId);
  }

  emitParticipantsUpdated(meetingId: string, participant: Participant) {
    this.server
      .to(meetingId)
      .emit(
        'host_participantUpdated',
        JSON.stringify(classToPlain(participant, { groups: ['role:host'] })),
      );

    const { userEmail: _, ...filteredParticipant } = participant;
    return this.server
      .to(meetingId)
      .emit('participantUpdated', JSON.stringify(filteredParticipant));
  }

  emitParticipantsDeleted(meetingId: string, participantId: string) {
    return this.server.to(meetingId).emit('participantDeleted', participantId);
  }

  emitAgendaUpdated(meetingId: string) {
    return this.server.to(meetingId).emit('agendaUpdated');
  }
}
