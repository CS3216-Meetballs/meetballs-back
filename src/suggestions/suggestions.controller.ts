import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UseBearerAuth } from 'src/shared/decorators/auth.decorator';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { SuggestionsService } from './suggestions.service';

@ApiTags('Suggestion')
@Controller('suggestion')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post('/')
  public async createSuggestion(
    @Body() createSuggestionDto: CreateSuggestionDto,
  ) {
    return this.suggestionsService.createSuggestion(createSuggestionDto);
  }

  @Put('/:suggestionId')
  public async updateSuggestion(
    @Body() updateSuggestionDto: UpdateSuggestionDto,
  ) {
    return this.suggestionsService.updateSuggestion(updateSuggestionDto);
  }

  @UseBearerAuth()
  @Put('/accept-suggestion/:suggestionId')
  public async markSuggestionAsAccepted(
    @Param('suggestionId', ParseUUIDPipe) suggestionId: string,
  ) {
    return this.suggestionsService.markSuggestionAsAccepted(suggestionId);
  }

  @Delete('/:suggestionId')
  public async deleteSuggestion(
    @Param('suggestionId', ParseUUIDPipe) suggestionId: string,
  ) {
    return this.suggestionsService.deleteSuggestion(suggestionId);
  }
}
