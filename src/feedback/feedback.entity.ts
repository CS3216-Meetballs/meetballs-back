import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'feedbacks' })
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'int2', nullable: false })
  rating?: number;

  @Column({ type: 'string', nullable: true })
  meetingId?: string;

  @CreateDateColumn()
  createdAt?: number;
}
