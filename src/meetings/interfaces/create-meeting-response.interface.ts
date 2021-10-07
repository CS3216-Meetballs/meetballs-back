import { AgendaItem } from '../../agenda-items/agenda-item.entity';
import { Participant } from '../../participants/participant.entity';
import { Meeting } from '../meeting.entity';

export class CreateMeetingResponse {
  meeting: Meeting;
  participants: Participant[];
  agendaItems: AgendaItem[];
}
