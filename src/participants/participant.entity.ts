import { IsEmail } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Meeting } from '../meetings/meeting.entity';
import { ParticipantRole } from '../shared/enum/participant-role.enum';

@Entity({ name: 'participants' })
export class Participant {
  @PrimaryColumn({ type: 'varchar' })
  meetingId: string;

  @ManyToOne(() => Meeting, (meeting: Meeting) => meeting.id, {
    onDelete: 'CASCADE',
  })
  // @JoinColumn({ name: 'meeting_id', referencedColumnName: 'id' })
  @JoinColumn()
  meeting: Meeting;

  @PrimaryColumn({ type: 'varchar' })
  @IsEmail()
  userEmail: string;

  @Column({ type: 'varchar', nullable: true })
  userName?: string;

  @Column({ type: 'timestamptz', nullable: true })
  timeJoined?: Date;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.CONFERENCE_MEMBER,
  })
  role?: number;
}
