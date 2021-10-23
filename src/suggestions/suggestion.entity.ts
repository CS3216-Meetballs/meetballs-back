import { ApiHideProperty } from '@nestjs/swagger';
import { Participant } from 'src/participants/participant.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Meeting } from '../meetings/meeting.entity';

@Entity({ name: 'suggestions' })
export class Suggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  meetingId: string;

  @ApiHideProperty()
  @ManyToOne(() => Meeting, (meeting: Meeting) => meeting.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meeting_id', referencedColumnName: 'id' })
  meeting: Meeting;

  @Column({ type: 'boolean', default: false })
  accepted: boolean;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'integer' })
  expectedDuration: number;

  @Column({ type: 'varchar', nullable: true })
  participantId?: string;

  @ApiHideProperty()
  @ManyToOne(() => Participant, {
    cascade: true,
    onDelete: 'SET NULL',
  })
  participant?: Participant;
}
