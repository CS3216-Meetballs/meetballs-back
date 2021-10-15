import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 } from 'uuid';
import * as bcrypt from 'bcrypt';

import { AppConfigService } from 'src/config/app.config';
import { JwtConfigService } from 'src/config/jwt.config';
import { MailService } from 'src/mail/mail.service';
import { Meeting } from 'src/meetings/meeting.entity';
import { GenerateParticipantMagicLinkPayload } from 'src/shared/interface/generate-participant-magic-link.interface';
import { In, Repository } from 'typeorm';
import {
  CreateParticipantDto,
  CreateParticipantsDto,
} from './dto/create-participant.dto';
import { DeleteParticipantsDto } from './dto/delete-participants.dto';
import { ParticipantEmailDto } from './dto/participant-email.dto';
import { UpdateParticipantsDto } from './dto/update-participants.dto';
import { Participant } from './participant.entity';
import { User } from 'src/users/user.entity';

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
    if (participant) {
      throw new BadRequestException(
        `Participant with email ${userEmail} is already added into this meeting`,
      );
    }
    const participantToBeCreated = this.participantsRepository.create({
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
  ): Promise<void> {
    const { meetingId, participants } = deleteParticipantsDto;
    const listOfUserEmails = [...participants].map(
      (participant) => participant.userEmail,
    );
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

  public async updateParticipants(
    updateParticipantsDto: UpdateParticipantsDto,
  ): Promise<void> {
    const { participants, meetingId } = updateParticipantsDto;
    const listOfUserEmails = [...participants].map(
      (participant) => participant.userEmail,
    );
    try {
      let participantsToUpdate = await this.participantsRepository.find({
        meetingId,
        userEmail: In(listOfUserEmails),
      });
      participantsToUpdate = participantsToUpdate.map((partcipant) => {
        const { userEmail } = partcipant;
        const {
          userName: newUsername,
          role: newRole,
          timeJoined: newTimeJoined,
        } = participants.find((p) => p.userEmail === userEmail);
        return {
          ...partcipant,
          ...(newUsername && { userName: newUsername }),
          ...(newRole && { role: newRole }),
          ...(newTimeJoined && { timeJoined: newTimeJoined }),
        };
      });
      await this.participantsRepository.save(participantsToUpdate);
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

  public async sendOneInvite(
    participant: Participant,
    meeting: Meeting,
    host: User,
  ): Promise<Participant> {
    const { meetingId, userEmail, userName } = participant;

    if (host.uuid !== meeting.hostId) {
      throw new UnauthorizedException('Not host of meeting');
    }

    const magicLinkOptions = this.jwtConfigService.magicLinkTokenOptions;
    const payload: GenerateParticipantMagicLinkPayload = {
      meetingId,
      userEmail,
      userName,
      nonce: v4(),
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
      newInvited: true,
    });
  }

  public async findOneParticipant(
    meetingId: string,
    userEmail: string,
  ): Promise<Participant> {
    const participant = await this.participantsRepository.findOne(
      { userEmail, meetingId },
      { relations: ['meeting'] },
    );
    if (!participant) {
      throw new NotFoundException(
        `Participant with email ${participant.userEmail} does not exist`,
      );
    }

    return participant;
  }
}
