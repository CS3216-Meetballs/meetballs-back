import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsEmail } from 'class-validator';
import { ZoomAccountType } from '../shared/enum/zoom-type.enum';
import {
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ type: 'varchar' })
  @Unique('unique_user_email', ['email'])
  @IsEmail()
  email: string;

  @Column({ default: false })
  isEmailConfirmed: boolean;

  @Column({ type: 'varchar' })
  firstName: string;

  @Column({ type: 'varchar' })
  lastName: string;

  @Column({
    type: 'enum',
    enum: ZoomAccountType,
    default: ZoomAccountType.NONE,
  })
  type: number;

  @Exclude()
  @ApiHideProperty()
  @Column('varchar')
  passwordHash: string;

  @Exclude()
  @ApiHideProperty()
  @Column('varchar', { nullable: true })
  refreshTokenHash: string;

  @Exclude()
  @ApiHideProperty()
  @CreateDateColumn()
  createdAt: Date;

  @Exclude()
  @ApiHideProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
