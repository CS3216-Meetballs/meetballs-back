import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Feedback } from './feedback.entity';
import { FeedbacksService } from './feedbacks.service';

@ApiTags('Participant')
@Controller('feedback')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @ApiCreatedResponse({
    description: 'Successfully submitted feedback',
    type: Feedback,
  })
  @ApiBody({ type: CreateFeedbackDto })
  @Post()
  public async createFeedback(
    @Body() createFeedbackDto: CreateFeedbackDto,
  ): Promise<Feedback> {
    return this.feedbacksService.createFeedback(createFeedbackDto);
  }
}
