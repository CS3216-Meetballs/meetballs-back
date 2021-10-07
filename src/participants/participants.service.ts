import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  CreateParticipantDto,
  CreateParticipantsDto,
} from './dto/create-participant.dto';
import { DeleteParticipantsDto } from './dto/delete-participants.dto';
import { UpdateParticipantsDto } from './dto/update-participants.dto';
import { Participant } from './participant.entity';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private participantsRepository: Repository<Participant>,
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
          username: newUsername,
          role: newRole,
          timeJoined: newTimeJoined,
        } = participants.find((p) => p.userEmail === userEmail);
        return {
          ...partcipant,
          ...(newUsername && { username: newUsername }),
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
}
