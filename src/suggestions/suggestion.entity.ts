import { ApiHideProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
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

  @Column({ type: 'varchar' })
  @IsEmail()
  userEmail: string; // to track who gave the suggestion

  @Column({ type: 'varchar', nullable: true })
  userName?: string;

  @Column({ type: 'boolean', default: false })
  accepted: boolean;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  description: boolean;

  @Column({ type: 'integer' })
  expectedDuration: number;
}
