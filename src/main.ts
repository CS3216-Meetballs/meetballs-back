import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('NUSCats')
    .setDescription("API endpoint for NUSCats's backend")
    .setVersion('1.0')
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, swaggerDoc);

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
