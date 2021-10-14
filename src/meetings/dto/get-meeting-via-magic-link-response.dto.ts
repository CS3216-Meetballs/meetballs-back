import { Participant } from 'src/participants/participant.entity';
import { Meeting } from '../meeting.entity';

export class GetMeetingViaMagicLinkDto {
  meeting: Meeting;
  joiner: Participant;
}
