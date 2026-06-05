import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TokenRolesGuard } from './guards/token-roles.guard';
import { JwtService } from './jwt.service';

/**
 * Global authentication module for the forums service.
 *
 * The module registers token validation support and a role/scope guard that
 * remains inert until controllers add `@Roles()` or `@Scopes()` metadata.
 */
@Global()
@Module({
  providers: [
    JwtService,
    {
      provide: APP_GUARD,
      useClass: TokenRolesGuard,
    },
  ],
  exports: [JwtService],
})
export class AuthModule {}
