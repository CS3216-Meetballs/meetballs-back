import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ZoomService } from './zoom.service';
import { ZoomController } from './zoom.controller';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://api.zoom.us/v2/',
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ZoomController],
  providers: [ZoomService],
  exports: [ZoomService],
})
export class ZoomModule {}
