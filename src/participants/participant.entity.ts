import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsEmail } from 'class-validator';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Meeting } from '../meetings/meeting.entity';
import { ParticipantRole } from '../shared/enum/participant-role.enum';

@Entity({ name: 'participants' })
@Index(['userEmail', 'meetingId'], { unique: true })
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  meetingId: string;

  @Column({ type: 'varchar' })
  @IsEmail()
  userEmail: string;

  @ApiHideProperty()
  @ManyToOne(() => Meeting, (meeting: Meeting) => meeting.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meeting_id', referencedColumnName: 'id' })
  meeting: Meeting;

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

  @Column({ type: 'boolean', default: false })
  isDuplicate: boolean;

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
