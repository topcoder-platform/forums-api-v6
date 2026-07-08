import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FORUMS_ADMIN_ROLE } from '../../forums/forums-access.types';
import {
  FORUMS_SCOPE_CREATE_TOPIC,
  FORUMS_SCOPE_MODERATE,
} from '../scope-mappings';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SCOPES_KEY } from '../decorators/scopes.decorator';
import { TokenRolesGuard } from './token-roles.guard';

interface GuardUser {
  userId?: string;
  roles?: string[];
  scopes?: string[];
  isMachine: boolean;
}

/**
 * Builds an execution context with route metadata for guard tests.
 *
 * @param user Authenticated user payload attached to the request.
 * @param metadata Route roles and scopes to attach to the handler.
 * @returns Minimal Nest execution context consumed by `TokenRolesGuard`.
 * @throws Does not throw.
 */
function makeContext(
  user: GuardUser | undefined,
  metadata: { roles?: string[]; scopes?: string[] },
): ExecutionContext {
  class TestController {}

  const handler = jest.fn();

  if (metadata.roles) {
    Reflect.defineMetadata(ROLES_KEY, metadata.roles, handler);
  }

  if (metadata.scopes) {
    Reflect.defineMetadata(SCOPES_KEY, metadata.scopes, handler);
  }

  return {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('TokenRolesGuard', () => {
  let guard: TokenRolesGuard;

  beforeEach(() => {
    guard = new TokenRolesGuard(new Reflector());
  });

  it('allows an admin human on a role and moderation-scope route', () => {
    const context = makeContext(
      {
        userId: 'admin-1',
        roles: [FORUMS_ADMIN_ROLE],
        scopes: [],
        isMachine: false,
      },
      {
        roles: [FORUMS_ADMIN_ROLE],
        scopes: [FORUMS_SCOPE_MODERATE],
      },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies a non-admin human even when the token has moderate:forums', () => {
    const context = makeContext(
      {
        userId: 'member-1',
        roles: ['copilot'],
        scopes: [FORUMS_SCOPE_MODERATE],
        isMachine: false,
      },
      {
        roles: [FORUMS_ADMIN_ROLE],
        scopes: [FORUMS_SCOPE_MODERATE],
      },
    );

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Insufficient permissions.'),
    );
  });

  it('allows M2M with moderate:forums on a role and moderation-scope route', () => {
    const context = makeContext(
      {
        roles: [],
        scopes: [FORUMS_SCOPE_MODERATE],
        isMachine: true,
      },
      {
        roles: [FORUMS_ADMIN_ROLE],
        scopes: [FORUMS_SCOPE_MODERATE],
      },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies M2M without moderate:forums on a moderation route', () => {
    const context = makeContext(
      {
        roles: [FORUMS_ADMIN_ROLE],
        scopes: [FORUMS_SCOPE_CREATE_TOPIC],
        isMachine: true,
      },
      {
        roles: [FORUMS_ADMIN_ROLE],
        scopes: [FORUMS_SCOPE_MODERATE],
      },
    );

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Insufficient permissions.'),
    );
  });

  it('still denies M2M on role-only moderation routes', () => {
    const context = makeContext(
      {
        roles: [FORUMS_ADMIN_ROLE],
        scopes: [FORUMS_SCOPE_MODERATE],
        isMachine: true,
      },
      {
        roles: [FORUMS_ADMIN_ROLE],
      },
    );

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('M2M token not allowed for this endpoint.'),
    );
  });
});
