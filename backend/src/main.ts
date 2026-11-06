import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { AppModule } from './app.module';
import { ensureUploadsDir, UPLOADS_DIR } from './raffles/uploads';

async function bootstrap() {
  ensureUploadsDir();
  const app = await NestFactory.create(AppModule);
  app.use('/api/uploads', express.static(UPLOADS_DIR));
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

bootstrap();
