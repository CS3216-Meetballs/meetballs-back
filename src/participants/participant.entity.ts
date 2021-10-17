import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsEmail } from 'class-validator';
import {
  Column,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Meeting } from '../meetings/meeting.entity';
import { ParticipantRole } from '../shared/enum/participant-role.enum';

@Entity({ name: 'participants' })
export class Participant {
  @PrimaryColumn({ type: 'varchar' })
  meetingId: string;

  @Column()
  @Generated('uuid')
  id: string;

  @ApiHideProperty()
  @ManyToOne(() => Meeting, (meeting: Meeting) => meeting.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meeting_id', referencedColumnName: 'id' })
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

  @Column({
    type: 'boolean',
    default: false,
  })
  invited: boolean;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  @Exclude()
  hashedMagicLinkToken: string;
}
