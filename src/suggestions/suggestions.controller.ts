import { ParticipantRole } from 'src/shared/enum/participant-role.enum';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
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
import { UseAuth } from 'src/shared/decorators/auth.decorator';
import { User } from '../users/user.entity';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { SuggestionsService } from './suggestions.service';
import { Suggestion } from './suggestion.entity';
import { AuthGuard } from '@nestjs/passport';
import { AccessUser } from 'src/shared/decorators/participant.decorator';
import { Participant } from 'src/participants/participant.entity';
import { MeetingsService } from 'src/meetings/meetings.service';
import { AgendaItem } from './../agenda-items/agenda-item.entity';
import { AccessGuard } from 'src/auth/guard/access.guard';
import { MeetingSocketGateway } from './../meeting-socket/meeting-socket.gateway';

@ApiTags('Suggestion')
@Controller('suggestion')
export class SuggestionsController {
  constructor(
    private readonly suggestionsService: SuggestionsService,
    private readonly meetingsService: MeetingsService,
    private readonly meetingSocketGateway: MeetingSocketGateway,
  ) {}

  @ApiCreatedResponse({
    description: 'Successfully get suggestions for meeting',
    type: [Suggestion],
  })
  @ApiParam({
    name: 'meetingId',
    description: 'The id of the meeting',
  })
  @UseAuth(AccessGuard)
  @Get('/:meetingId')
  public async getSuggestions(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
  ): Promise<Suggestion[]> {
    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== meetingId ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
    ) {
      throw new ForbiddenException('Not allowed to access meeting');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        meetingId,
      ))
    ) {
      throw new ForbiddenException('Not host of meeting');
    }

    return this.suggestionsService.getSuggestions(meetingId);
  }

  @ApiOkResponse({
    description:
      'Successfully get suggestions for meeting suggested by participant',
    type: [Suggestion],
  })
  @ApiParam({
    name: 'meetingId',
    description: 'The id of the meeting',
  })
  @UseAuth(AuthGuard('participant'))
  @Get('/participant/:meetingId')
  public async getSuggestionsForParticipant(
    @AccessUser() participant: Participant,
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
  ): Promise<Suggestion[]> {
    if (participant.meetingId !== meetingId) {
      throw new ForbiddenException('Not allowed to access meeting');
    }
    return this.suggestionsService.getSuggestions(meetingId, participant);
  }

  @ApiCreatedResponse({
    description: 'Created suggestion for meeting',
    type: Suggestion,
  })
  @UseAuth(AuthGuard('participant'))
  @Post('/')
  public async createSuggestion(
    @AccessUser() participant: Participant,
    @Body() createSuggestionDto: CreateSuggestionDto,
  ): Promise<Suggestion> {
    if (participant.meetingId !== createSuggestionDto.meetingId) {
      throw new ForbiddenException(
        'Not allowed to create suggestion for this meeting',
      );
    }
    const suggestion = await this.suggestionsService.createSuggestion(
      createSuggestionDto,
      participant,
    );

    this.meetingSocketGateway.emitSuggestionsUpdated(
      suggestion.meetingId,
      suggestion,
    );

    return suggestion;
  }

  @ApiOkResponse({
    description: 'Successfully updated suggestion',
    type: Suggestion,
  })
  @ApiParam({
    name: 'suggestionId',
    description: 'The id of the suggestion',
  })
  @UseAuth(AccessGuard)
  @ApiBody({ type: UpdateSuggestionDto })
  @Put('/:suggestionId')
  public async updateSuggestion(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('suggestionId', ParseUUIDPipe) suggestionId: string,
    @Body() updateSuggestionDto: UpdateSuggestionDto,
  ): Promise<Suggestion> {
    const suggestion = await this.suggestionsService.findOneSuggestion(
      suggestionId,
    );
    if (!suggestion) {
      throw new NotFoundException('Suggestion cannot be found');
    }

    if (
      userOrParticipant['meetingId'] &&
      ((userOrParticipant as Participant).meetingId !== suggestion.meetingId ||
        ((userOrParticipant as Participant).id !== suggestion.participantId &&
          (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST))
    ) {
      throw new ForbiddenException('Not allowed to edit suggestion');
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        suggestion.meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to access meeting');
    }

    const updatedSuggestion = await this.suggestionsService.updateSuggestion(
      updateSuggestionDto,
      suggestion,
    );
    this.meetingSocketGateway.emitSuggestionsUpdated(
      suggestion.meetingId,
      updatedSuggestion,
    );

    return updatedSuggestion;
  }

  @ApiCreatedResponse({
    description: 'Successfully accepted suggestion and created an agenda item',
    type: AgendaItem,
  })
  @ApiParam({
    name: 'suggestionId',
    description: 'The id of the suggestion',
  })
  @UseAuth(AccessGuard)
  @Put('/accept/:suggestionId')
  public async markSuggestionAsAccepted(
    @Param('suggestionId', ParseUUIDPipe) suggestionId: string,
    @AccessUser() userOrParticipant: User | Participant,
  ): Promise<AgendaItem> {
    const suggestionToBeAccepted =
      await this.suggestionsService.findOneSuggestion(suggestionId);
    if (!suggestionToBeAccepted) {
      throw new NotFoundException('Suggestion cannot be found');
    }

    if (userOrParticipant['meetingId']) {
      if (
        (userOrParticipant as Participant).meetingId !==
          suggestionToBeAccepted.meetingId ||
        (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST
      ) {
        throw new ForbiddenException('Not co-host of meeting');
      }
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        suggestionToBeAccepted.meetingId,
      ))
    ) {
      throw new ForbiddenException(
        'Cannot accept a suggestion for a meeting when user is not the host',
      );
    }

    const [suggestion, agendaItem] =
      await this.suggestionsService.markSuggestionAsAccepted(
        suggestionToBeAccepted,
      );

    this.meetingSocketGateway.emitSuggestionsUpdated(
      suggestion.meetingId,
      suggestion,
    );

    this.meetingSocketGateway.emitAgendaUpdated(agendaItem.meetingId);

    return agendaItem;
  }

  @ApiOkResponse({
    description: 'Successfully deleted suggestion',
  })
  @ApiParam({
    name: 'suggestionId',
    description: 'The id of the suggestion',
  })
  @UseAuth(AccessGuard)
  @Delete('/:suggestionId')
  public async deleteSuggestion(
    @AccessUser() userOrParticipant: User | Participant,
    @Param('suggestionId', ParseUUIDPipe) suggestionId: string,
  ): Promise<Suggestion> {
    const suggestion = await this.suggestionsService.findOneSuggestion(
      suggestionId,
    );
    if (!suggestion) {
      throw new NotFoundException('Suggestion to be deleted not found');
    }

    if (userOrParticipant['meetingId']) {
      if (
        (userOrParticipant as Participant).meetingId !== suggestion.meetingId ||
        ((userOrParticipant as Participant).id !== suggestion.participantId &&
          (userOrParticipant as Participant).role !== ParticipantRole.CO_HOST)
      ) {
        throw new ForbiddenException('Not allowed to access meeting');
      }
    } else if (
      userOrParticipant['uuid'] &&
      !(await this.meetingsService.isHostOfMeeting(
        (userOrParticipant as User).uuid,
        suggestion.meetingId,
      ))
    ) {
      throw new ForbiddenException('Not allowed to access meeting');
    }

    await this.suggestionsService.deleteSuggestion(suggestion);
    console.log(suggestion.meetingId, suggestionId);
    this.meetingSocketGateway.emitSuggestionsDeleted(
      suggestion.meetingId,
      suggestionId,
    );
    return;
  }
}
