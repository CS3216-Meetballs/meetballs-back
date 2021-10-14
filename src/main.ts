import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  if (
    process.env['NODE_ENV'] === 'development' ||
    process.env['DISABLE_CORS'] === 'true'
  ) {
    app.enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    });
  } else {
    app.enableCors({
      origin: process.env.CLIENT_URL,
      credentials: true,
    });
  }

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.use(morgan('tiny'));

  const config = new DocumentBuilder()
    .setTitle('MeetBalls')
    .setDescription("API endpoint for MeetBall's backend")
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, swaggerDoc);

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
