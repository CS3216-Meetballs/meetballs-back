import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Server')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Checks server health
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
