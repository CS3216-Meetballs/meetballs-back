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
  constructor(private authService: AuthService) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const id = client.handshake.auth.meetingId as string;
    const accessToken = client.handshake.auth.token as string;

    const user = accessToken
      ? await this.authService.getUserFromToken(accessToken).catch(() => null)
      : null;

    client.join(id);
    if (user) {
      client
        .to(id)
        .emit('userConnected', `${user.firstName} joined the meeting`);
      console.log(`Client ${user.email} connected to ${id}`);
    } else {
      client.to(id).emit('userConnected', 'New user joined the meeting');
      console.log(`Client ${client.id} connected to ${id}`);
    }
    return;
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

  emitParticipantsUpdated(meetingId: string, participant: Participant) {
    this.server
      .to(meetingId)
      .emit(
        'host_participantUpdated',
        JSON.stringify(classToPlain(participant, { groups: ['role:host'] })),
      );
    return this.server
      .to(meetingId)
      .emit(
        'participantUpdated',
        JSON.stringify(classToPlain(participant, { groups: [] })),
      );
  }

  emitAgendaUpdated(meetingId: string) {
    return this.server.to(meetingId).emit('agendaUpdated');
  }
}
