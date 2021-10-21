import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UseBearerAuth } from 'src/shared/decorators/auth.decorator';
import { Usr } from 'src/shared/decorators/user.decorator';
import { User } from '../users/user.entity';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { SuggestionsService } from './suggestions.service';
import { Suggestion } from './suggestion.entity';

@ApiTags('Suggestion')
@Controller('suggestion')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @ApiCreatedResponse({
    description: 'Successfully get suggestions for meeting',
    type: [Suggestion],
  })
  @ApiParam({
    name: 'meetingId',
    description: 'The id of the meeting',
  })
  @UseBearerAuth()
  @Get('/:meetingId')
  public async getSuggestions(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
  ): Promise<Suggestion[]> {
    return this.suggestionsService.getSuggestions(meetingId);
  }

  // TODO: Update this to use the participant guard
  @ApiOkResponse({
    description:
      'Successfully get suggestions for meeting suggested by participant',
    type: [Suggestion],
  })
  @ApiParam({
    name: 'meetingId',
    description: 'The id of the meeting',
  })
  @ApiParam({
    name: 'participantId',
    description: 'The id of the participant',
  })
  @Get('/:meetingId/:participantId')
  public async getSuggestionsForParticipant(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ): Promise<Suggestion[]> {
    return this.suggestionsService.getSuggestions(meetingId, participantId);
  }

  @Post('/')
  public async createSuggestion(
    @Body() createSuggestionDto: CreateSuggestionDto,
  ): Promise<Suggestion> {
    return this.suggestionsService.createSuggestion(createSuggestionDto);
  }

  @ApiOkResponse({
    description: 'Successfully updated suggestion',
    type: Suggestion,
  })
  @ApiParam({
    name: 'suggestionId',
    description: 'The id of the suggestion',
  })
  @ApiBody({ type: UpdateSuggestionDto })
  @Put('/:suggestionId')
  public async updateSuggestion(
    @Param('suggestionId', ParseUUIDPipe) suggestionId: string,
    @Body() updateSuggestionDto: UpdateSuggestionDto,
  ): Promise<Suggestion> {
    return this.suggestionsService.updateSuggestion(
      updateSuggestionDto,
      suggestionId,
    );
  }

  @ApiCreatedResponse({
    description: 'Successfully accepted suggestion and created an agenda item',
  })
  @ApiParam({
    name: 'suggestionId',
    description: 'The id of the suggestion',
  })
  @UseBearerAuth()
  @Put('/accept/:suggestionId')
  public async markSuggestionAsAccepted(
    @Param('suggestionId', ParseUUIDPipe) suggestionId: string,
    @Usr() requester: User,
  ): Promise<void> {
    return this.suggestionsService.markSuggestionAsAccepted(
      suggestionId,
      requester.uuid,
    );
  }

  @ApiOkResponse({
    description: 'Successfully deleted suggestion',
    type: Suggestion,
  })
  @ApiParam({
    name: 'suggestionId',
    description: 'The id of the suggestion',
  })
  @Delete('/:suggestionId')
  public async deleteSuggestion(
    @Param('suggestionId', ParseUUIDPipe) suggestionId: string,
  ): Promise<Suggestion> {
    return this.suggestionsService.deleteSuggestion(suggestionId);
  }
}
