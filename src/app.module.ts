import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TokenValidatorMiddleware } from './auth/request/token-validator.middleware';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import notificationsConfig from './config/notifications.config';
import { DbModule } from './db/db.module';
import { ForumsModule } from './forums/forums.module';
import { HealthModule } from './health/health.module';

/**
 * Root module for the forums service.
 *
 * The module wires global configuration, database connectivity, health routes,
 * forum domain controllers, notification configuration, and the reusable token
 * validation middleware. It is used by `main.ts` during Nest application
 * bootstrap.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, notificationsConfig],
    }),
    AuthModule,
    DbModule,
    ForumsModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  /**
   * Applies middleware to every route in the service.
   *
   * @param consumer Nest middleware consumer used to register middleware.
   * @returns Nothing. The middleware registration is applied during module setup.
   * @throws Does not throw directly; middleware dependencies are resolved by Nest.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TokenValidatorMiddleware).forRoutes('*');
  }
}
