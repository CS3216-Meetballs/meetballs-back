import { IsEmail } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Meeting } from '../meetings/meeting.entity';
import { ParticipantRole } from '../shared/enum/participant-role.enum';

@Entity({ name: 'participants' })
export class Participant {
  @PrimaryColumn({ type: 'varchar' })
  meeting_id: string;

  @ManyToOne(() => Meeting, (meeting: Meeting) => meeting.id)
  @JoinColumn({ name: 'meeting_id', referencedColumnName: 'id' })
  meeting: Meeting;

  @Column({ type: 'varchar', nullable: true })
  username: string;

  @Column({ type: 'varchar' })
  @IsEmail()
  user_email: string;

  @Column({ type: 'timestamptz', nullable: true })
  time_joined?: Date;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.CONFERENCE_MEMBER,
  })
  role: number;
}
