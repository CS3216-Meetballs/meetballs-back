import { IsDefined } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Meeting } from '../meetings/meeting.entity';

@Entity({ name: 'agenda_items' })
export class AgendaItem {
  @PrimaryColumn({ type: 'varchar' })
  meeting_id: string;

  @ManyToOne(() => Meeting, (meeting) => meeting.agendaItems)
  @JoinColumn({ name: 'meeting_id', referencedColumnName: 'id' })
  meeting: Meeting;

  @PrimaryColumn({ type: 'int2' })
  position: number;

  @Column({ type: 'varchar' })
  @IsDefined()
  name: string;

  @Column({ type: 'varchar' })
  description: string;

  // To be updated when is_current updates from false to true
  @Column({ type: 'timestamptz', nullable: true })
  start_time?: Date;

  // To be updated when is_current updates from true to false
  @Column({ type: 'integer', nullable: true })
  actual_duration?: number;

  @Column({ type: 'integer' })
  @IsDefined()
  expected_duration: number;

  @Column({ type: 'boolean', default: false })
  is_current: boolean;
}
