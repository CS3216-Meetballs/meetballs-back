import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AppConfigService } from 'src/config/app.config';
import { JwtConfigService } from 'src/config/jwt.config';
import { MailService } from 'src/mail/mail.service';
import { Meeting } from 'src/meetings/meeting.entity';
import { ONE_HOUR_BUFFER } from 'src/shared/commons/buffer';
import { GenerateParticipantMagicLinkPayload } from 'src/shared/interface/generate-participant-magic-link.interface';
import { In, Repository } from 'typeorm';
import { CreateParticipantMagicLinkDto } from './dto/create-participant-magic-link.dto';
import {
  CreateParticipantDto,
  CreateParticipantsDto,
} from './dto/create-participant.dto';
import { DeleteParticipantsDto } from './dto/delete-participants.dto';
import { ParticipantEmailDto } from './dto/participant-email.dto';
import { UpdateParticipantsDto } from './dto/update-participants.dto';
import { Participant } from './participant.entity';

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

  public async generateMagicLink(
    createParticipantMagicLinkDto: CreateParticipantMagicLinkDto,
    meeting: Meeting,
  ): Promise<boolean> {
    const { meetingId, userEmail } = createParticipantMagicLinkDto;
    const participant = await this.participantsRepository.findOne({
      meetingId,
      userEmail,
    });
    if (!participant) {
      throw new NotFoundException(
        `Participant with email ${participant.userEmail} does not exist`,
      );
    }
    if (!participant) {
      throw new BadRequestException('Email does not exist');
    }
    const payload: GenerateParticipantMagicLinkPayload = {
      meetingId,
      userEmail,
      userName: participant.userName,
      type: 'confirm',
    };

    const magicLinkOptions = this.jwtConfigService.magicLinkTokenOptions;
    const expiry = this.getTimeToMeetingEndTimeWithBuffer(meeting);
    const token = this.jwtService.sign(payload, {
      secret: magicLinkOptions.secret,
      expiresIn: `${expiry}s`,
    });

    const sent = await this.mailService.sendMagicLink(
      participant,
      `${this.appConfigService.clientUrl}/meeting?token=${token}`,
    );
    if (!sent) {
      throw new InternalServerErrorException('Error during sending of email');
    }
    return sent;
  }

  private getTimeToMeetingEndTimeWithBuffer(meeting: Meeting) {
    if (!meeting.duration) {
      // Should never happen when get the duration using zoom api
      return ONE_HOUR_BUFFER;
    }
    const now = new Date();
    const diff =
      // By right duration should always exist but for now assume might not
      meeting.startedAt.getTime() - now.getTime() + (meeting.duration ?? 0);
    if (diff <= 0) {
      return 0;
    } else {
      // Add a buffer in case end late.
      return diff + ONE_HOUR_BUFFER;
    }
  }

  public async getOneMeetingByMeetingIdAndOneUser(
    createParticipantMagicLinkDto: CreateParticipantMagicLinkDto,
  ): Promise<Meeting> {
    const { meetingId, userEmail } = createParticipantMagicLinkDto;
    const participant = await this.participantsRepository
      .createQueryBuilder('participants')
      .innerJoinAndSelect('participants.meeting', 'meeting')
      .where('participants.meetingId = :meetingId', { meetingId })
      .andWhere('participants.userEmail = :userEmail', { userEmail })
      .getOne();
    if (!participant) {
      // Should not happen but just in case
      throw new InternalServerErrorException(
        `No meeting with meetingId ${meetingId}`,
      );
    }
    return participant.meeting;
  }
}
