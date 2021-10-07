import { AgendaItem } from '../agenda-items/agenda-item.entity';
import { MeetingsService } from './meetings.service';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Meeting } from './meeting.entity';
import { classToPlain } from 'class-transformer';

@WebSocketGateway({ namespace: 'meeting' })
export class MeetingsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private meetingService: MeetingsService) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket, meetingId: string) {
    const id = client.handshake.auth.meetingId as string;
    const validMeetingId = await this.meetingService.doesMeetingExist(id);

    if (!validMeetingId) {
      throw new WsException('Invalid meeting id.');
    }

    client.join(id);
    client.to(id).emit('userConnected');
    console.log(`Client connected: ${client.id}`);
    return;
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  emitMeetingUpdated(meetingId: string, meeting: Meeting) {
    return this.server
      .to(meetingId)
      .emit('meetingUpdated', classToPlain(meeting));
  }

  emitParticipantsUpdated(meetingId: string) {
    return this.server.to(meetingId).emit('participantUpdated');
  }

  emitAgendaUpdated(meetingId: string) {
    return this.server.to(meetingId).emit('agendaUpdated');
  }

  // @SubscribeMessage('announcement')
  // async broadcast(
  //   client: Socket,
  //   @MessageBody() message: string,
  // ): Promise<number> {
  //   const rooms = Object.keys(client.rooms);
  //   for (const r in rooms) {

  //   }
  //   return data;
  // }
}
