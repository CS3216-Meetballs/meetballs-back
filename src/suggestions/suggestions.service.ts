import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { Suggestion } from './suggestion.entity';

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectRepository(Suggestion)
    private readonly suggestionsRepository: Repository<Suggestion>,
  ) {}

  public async createSuggestion(createSuggestionDto: CreateSuggestionDto) {}

  public async updateSuggestion(updateSuggestionDto: UpdateSuggestionDto) {}

  public async markSuggestionAsAccepted(suggestionId: string) {}

  public async deleteSuggestion(suggestionId: string) {}
}
