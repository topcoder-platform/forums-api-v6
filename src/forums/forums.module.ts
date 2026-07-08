import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ChallengeAccessService } from './challenge-access.service';
import { EventBusService } from './event-bus.service';
import { ForumsAccessPolicyService } from './forums-access-policy.service';
import { ForumsCommandService } from './forums-command.service';
import { ForumsMemberDirectoryService } from './forums-member-directory.service';
import { ForumsModerationService } from './forums-moderation.service';
import { ForumsReadQueryService } from './forums-read-query.service';
import { ForumsReadService } from './forums-read.service';
import { ForumsTopicContextService } from './forums-topic-context.service';
import { ForumsWatchNotificationService } from './forums-watch-notification.service';
import { IdentityAccessService } from './identity-access.service';
import { MemberHandleService } from './member-handle.service';
import { ModerationController } from './moderation.controller';
import { PostsController } from './posts.controller';
import { ResourceAccessService } from './resource-access.service';
import { TopicsController } from './topics.controller';

/**
 * Forums module for content workflows, topic reads, moderation management, and
 * watch notifications.
 *
 * The module wires topic read controllers, mutation controllers, transactional
 * command service, read orchestration, raw read queries, context loader, policy
 * service, moderation controller/service, notification publisher, event-bus
 * adapter, and cross-service adapters.
 */
@Module({
  imports: [DbModule],
  controllers: [TopicsController, PostsController, ModerationController],
  providers: [
    ChallengeAccessService,
    EventBusService,
    ForumsAccessPolicyService,
    ForumsCommandService,
    ForumsMemberDirectoryService,
    ForumsModerationService,
    ForumsReadQueryService,
    ForumsReadService,
    ForumsTopicContextService,
    ForumsWatchNotificationService,
    IdentityAccessService,
    MemberHandleService,
    ResourceAccessService,
  ],
})
export class ForumsModule {}
