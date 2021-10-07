import { IsDefined, IsPositive, IsUrl } from 'class-validator';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AgendaItem } from '../agenda-items/agenda-item.entity';
import { Participant } from '../participants/participant.entity';
import { ZoomMeetingStatus } from '../shared/enum/zoom-meeting-status.enum';
import { User } from '../users/user.entity';

@Entity({ name: 'meetings' })
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  @IsDefined()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  // Should this be createdDate of the zoom link or meetballs link?
  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'integer' })
  @IsPositive()
  duration: number;

  @Column({ type: 'varchar', nullable: true })
  hostId?: string;

  @ManyToOne(() => User, (user: User) => user.uuid)
  @JoinColumn({ name: 'host_id', referencedColumnName: 'uuid' })
  host?: User;

  @Column({ type: 'varchar' })
  meetingId: string;

  @Column({ type: 'varchar' })
  @IsUrl()
  startUrl: string;

  @Column({ type: 'varchar' })
  @IsUrl()
  joinUrl: string;

  // TODO: How will the be triggered to update to started?
  @Column({
    type: 'enum',
    enum: ZoomMeetingStatus,
    default: ZoomMeetingStatus.WAITING,
  })
  type: number;

  @Column({ type: 'boolean', default: false })
  enableTranscription: boolean;

  @Column({ type: 'varchar', nullable: true })
  transcription: string;

  @Column({ type: 'varchar' })
  @IsUrl()
  videoUrl: string;

  @OneToMany(() => AgendaItem, (agendaItem) => agendaItem.meeting, {
    cascade: true,
  })
  agendaItems?: AgendaItem[];

  // one to many for participants_lists
  @OneToMany(() => Participant, (participant) => participant.meeting, {
    cascade: true,
  })
  participants: Participant[];
}
