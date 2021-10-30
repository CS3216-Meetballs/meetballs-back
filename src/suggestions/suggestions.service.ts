import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AgendaItemsService } from 'src/agenda-items/agenda-items.service';
import { MeetingsService } from 'src/meetings/meetings.service';
import { Participant } from 'src/participants/participant.entity';
import { AgendaItem } from './../agenda-items/agenda-item.entity';

import { Repository } from 'typeorm';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { Suggestion } from './suggestion.entity';
import { ParticipantsService } from '../participants/participants.service';

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectRepository(Suggestion)
    private readonly suggestionsRepository: Repository<Suggestion>,
    private readonly agendaItemsService: AgendaItemsService,
    private readonly meetingsService: MeetingsService,
    private readonly participantsService: ParticipantsService,
  ) {}

  public async getSuggestions(
    meetingId: string,
    participant?: Participant,
  ): Promise<Suggestion[]> {
    return this.suggestionsRepository.find({
      meetingId,
      ...(participant && { participantId: participant.id }),
    });
  }

  public async createSuggestion(
    createSuggestionDto: CreateSuggestionDto,
    participant: Participant,
  ): Promise<Suggestion> {
    const { meetingId, description, expectedDuration, name, speakerId } =
      createSuggestionDto;
    let arrowedSpeaker: Participant;
    if (speakerId) {
      arrowedSpeaker = await this.participantsService.findOneParticipantById(
        speakerId,
      );
      if (!arrowedSpeaker) {
        throw new NotFoundException('Arrowed speaker not found');
      }
    }
    const suggestionToBeCreated = this.suggestionsRepository.create({
      meetingId,
      name,
      description,
      expectedDuration,
      participantId: participant.id,
      ...(speakerId && {
        id: arrowedSpeaker.id,
      }),
    });
    const createdSuggestion = await this.suggestionsRepository.save(
      suggestionToBeCreated,
    );
    return this.suggestionsRepository.findOne({ id: createdSuggestion.id });
  }

  public async updateSuggestion(
    updateSuggestionDto: UpdateSuggestionDto,
    suggestion: Suggestion,
  ) {
    const { description, expectedDuration, name, speakerId } =
      updateSuggestionDto;
    let speaker: Participant;
    if (speakerId) {
      speaker = await this.participantsService.findOneParticipantById(
        speakerId,
      );
    }
    suggestion = {
      ...suggestion,
      ...(description && { description }),
      ...(expectedDuration && { expectedDuration }),
      ...(name && { name }),
      ...(speakerId ? { speaker } : { speaker: null }),
    };
    const updatedSuggestion = await this.suggestionsRepository.save(suggestion);
    return this.suggestionsRepository.findOne({ id: updatedSuggestion.id });
  }

  public async markSuggestionAsAccepted(
    suggestionToBeAccepted: Suggestion,
  ): Promise<[Suggestion, AgendaItem]> {
    suggestionToBeAccepted.accepted = true;
    const suggestion = await this.suggestionsRepository.save(
      suggestionToBeAccepted,
    );
    const newAgenda =
      await this.agendaItemsService.createOneAgendaItemFromSuggestion(
        suggestion,
      );

    return [suggestion, newAgenda];
  }

  public async deleteSuggestion(
    suggestionToBeDeleted: Suggestion,
  ): Promise<Suggestion> {
    await this.suggestionsRepository.remove(suggestionToBeDeleted);
    return suggestionToBeDeleted;
  }

  public async findOneSuggestion(suggestionId: string) {
    return this.suggestionsRepository.findOne({
      id: suggestionId,
    });
  }
}
