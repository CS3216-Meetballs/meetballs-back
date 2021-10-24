import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { CustomClassSerializerInterceptor } from './shared/interceptors/serialize.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.use(helmet({}));
  app.use(compression());

  if (
    process.env['NODE_ENV'] === 'development' ||
    process.env['NODE_ENV'] === 'staging'
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

  app.useGlobalInterceptors(
    new CustomClassSerializerInterceptor(app.get(Reflector)),
  );
  app.use(morgan('tiny'));

  if (['production', 'staging'].indexOf(process.env.NODE_ENV) === -1) {
    const config = new DocumentBuilder()
      .setTitle('MeetBalls')
      .setDescription("API endpoint for MeetBall's backend")
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const swaggerDoc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, swaggerDoc);
  }

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
