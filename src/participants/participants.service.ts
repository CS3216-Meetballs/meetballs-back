import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 } from 'uuid';
import * as bcrypt from 'bcrypt';

import { AppConfigService } from 'src/config/app.config';
import { JwtConfigService } from 'src/config/jwt.config';
import { MailService } from 'src/mail/mail.service';
import { Meeting } from 'src/meetings/meeting.entity';
import { In, Repository } from 'typeorm';
import {
  CreateParticipantDto,
  CreateParticipantsDto,
} from './dto/create-participant.dto';
import { DeleteParticipantsDto } from './dto/delete-participants.dto';
import { ParticipantEmailDto } from './dto/participant-email.dto';
import { UpdateParticipantDto } from './dto/update-participants.dto';
import { Participant } from './participant.entity';
import { User } from 'src/users/user.entity';
import { isNil } from 'lodash';
import { Version1MagicPayload } from './../shared/interface/generate-participant-magic-link.interface';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantsRepository: Repository<Participant>,
    private readonly jwtConfigService: JwtConfigService,
    private readonly jwtService: JwtService,
    private readonly appConfigService: AppConfigService,
    private readonly mailService: MailService,
  ) {}

  public async createOneParticipant(
    createParticipantDto: CreateParticipantDto,
  ): Promise<Participant> {
    const { meetingId, userEmail } = createParticipantDto;
    const participant = await this.participantsRepository.findOne({
      meetingId,
      userEmail,
    });
    if (participant && !participant.isDuplicate) {
      throw new BadRequestException(
        `Participant with email ${userEmail} is already added into this meeting`,
      );
    }
    const participantToBeCreated = this.participantsRepository.create({
      id: participant?.id || undefined,
      isDuplicate: false,
      ...createParticipantDto,
    });
    return this.participantsRepository.save(participantToBeCreated);
  }

  public async createParticipants(
    createParticipantsDto: CreateParticipantsDto,
  ): Promise<Participant[]> {
    try {
      const participantsToBeCreated = this.participantsRepository.create([
        ...createParticipantsDto.participants,
      ]);
      return this.participantsRepository.save(participantsToBeCreated);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  public async deleteParticipants(
    deleteParticipantsDto: DeleteParticipantsDto,
    requester: User,
  ): Promise<void> {
    const { meetingId, participants } = deleteParticipantsDto;
    const listOfUserEmails = [...participants].map(
      (participant) => participant.userEmail,
    );
    if (!isNil(listOfUserEmails.find((email) => email === requester.email))) {
      throw new BadRequestException('You cannot remove yourself');
    }
    try {
      const participantsToBeDeleted = await this.participantsRepository.find({
        meetingId,
        userEmail: In(listOfUserEmails),
      });
      await this.participantsRepository.remove(participantsToBeDeleted);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  public async updateParticipant(
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant> {
    const { userEmail, meetingId } = updateParticipantDto;
    const participantToUpdate = await this.participantsRepository.findOne({
      meetingId,
      userEmail,
    });
    if (!participantToUpdate) {
      throw new NotFoundException('Participant not found');
    }
    try {
      const { userName, role, timeJoined } = updateParticipantDto;

      return this.participantsRepository.save({
        ...participantToUpdate,
        ...(userName && { userName }),
        ...(role && { role }),
        ...(timeJoined && { timeJoined }),
      });
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  public async getParticipantsByMeetingId(
    meetingId: string,
  ): Promise<Participant[]> {
    return this.participantsRepository.find({ meetingId });
  }

  public async markPresent(
    meetingId: string,
    participantEmailDto: ParticipantEmailDto,
  ): Promise<Participant> {
    const participant = await this.participantsRepository.findOne({
      meetingId,
      userEmail: participantEmailDto.email,
    });
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.timeJoined = new Date();
    await this.participantsRepository.save(participant);
    return participant;
  }

  public async markAbsent(
    meetingId: string,
    participantEmailDto: ParticipantEmailDto,
  ): Promise<Participant> {
    const participant = await this.participantsRepository.findOne({
      meetingId,
      userEmail: participantEmailDto.email,
    });
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.timeJoined = null;
    await this.participantsRepository.save(participant);
    return participant;
  }

  public async markDuplicate(
    meetingId: string,
    participantEmailDto: ParticipantEmailDto,
  ): Promise<Participant> {
    const participant = await this.participantsRepository.findOne({
      meetingId,
      userEmail: participantEmailDto.email,
    });
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.isDuplicate = true;
    participant.timeJoined = null;
    participant.invited = false;
    await this.participantsRepository.save(participant);
    return participant;
  }

  public async sendOneInvite(
    participant: Participant,
    meeting: Meeting,
    host: User,
  ): Promise<Participant> {
    if (meeting.endedAt && meeting.endedAt < new Date()) {
      throw new BadRequestException('Meeting has already ended');
    }
    const { id } = participant;

    if (host.uuid !== meeting.hostId) {
      throw new ForbiddenException('Not host of meeting');
    }

    const magicLinkOptions = this.jwtConfigService.magicLinkTokenOptions;
    const payload: Version1MagicPayload = {
      ver: '1.0.0',
      pid: id,
      nce: v4(),
    };

    // no expiry -- always valid
    const token = this.jwtService.sign(payload, {
      secret: magicLinkOptions.secret,
    });

    try {
      await this.mailService.sendMagicLink(
        participant,
        meeting,
        host,
        `${this.appConfigService.clientUrl}/meeting?token=${token}`,
      );
    } catch (err) {
      throw new InternalServerErrorException('Failed to send email');
    }

    const hashedMagicLinkToken = await bcrypt.hash(token, 12);

    // update magic link in database
    return this.participantsRepository.save({
      ...participant,
      hashedMagicLinkToken: hashedMagicLinkToken,
      invited: true,
    });
  }

  public async findOneParticipant(
    meetingId: string,
    userEmail: string,
    relations: string[] = [],
  ): Promise<Participant> {
    const participant = await this.participantsRepository.findOne(
      { userEmail, meetingId },
      { relations },
    );
    if (!participant) {
      throw new NotFoundException(`Participant does not exist`);
    }

    return participant;
  }

  public async findOneParticipantById(
    participantId: string,
    relations: string[] = [],
  ): Promise<Participant> {
    const participant = await this.participantsRepository.findOne(
      { id: participantId },
      { relations },
    );
    if (!participant) {
      throw new NotFoundException(`Participant does not exist`);
    }

    return participant;
  }
}
