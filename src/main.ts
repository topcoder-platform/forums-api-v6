import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DbService } from './db/db.service';

const API_PREFIX = 'v6/forums';

/**
 * Boots the NestJS forums API service.
 *
 * The bootstrap configures the `/v6/forums` route prefix, validation, Swagger
 * at `/v6/forums/api-docs`, CORS, body parsers, and database shutdown hooks.
 *
 * @returns A promise that resolves once the HTTP server is listening.
 * @throws Propagates Nest bootstrap, database initialization, or listen errors.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const logger = new Logger('ForumsBootstrap');
  const configService = app.get(ConfigService);

  app.enableCors();
  app.setGlobalPrefix(API_PREFIX);
  app.useBodyParser('json', { limit: '15mb' });
  app.useBodyParser('urlencoded', { limit: '15mb', extended: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const dbService = app.get(DbService);
  dbService.enableShutdownHooks(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Topcoder Forums API')
    .setDescription(
      'Topcoder forums API. The service exposes topic read routes protected by `read:forums-topics` plus transactional topic, post, human-member post-reaction, watch, and read-state mutations with centralized forums authorization, runtime member/IP ban checks, locked-topic content-mutation restrictions, inherited topic restrictions, challenge/resource access checks, granular M2M scopes, and post-commit best-effort watch notification emails for created posts and child-topic starter posts. Dedicated moderation management routes let human administrators or M2M callers with `moderate:forums` lock/unlock topics and manage member or exact-IP bans; challenge copilots do not gain moderation-endpoint access. Topic detail embeds posts with shared reaction counts and current-member reaction state under `read:forums-topics`; `read:forums-posts` remains reserved for future post-specific reads. Health and readiness remain DB-only.',
    )
    .setVersion('6.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT or M2M bearer token',
      in: 'header',
    })
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`/${API_PREFIX}/api-docs`, app, swaggerDocument);

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', reason as string);
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error(`Uncaught exception: ${error.message}`, error.stack);
  });

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);
  logger.log(`Forums API listening on port ${port}`);
}

void bootstrap();
