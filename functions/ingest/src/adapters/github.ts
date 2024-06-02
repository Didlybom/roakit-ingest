import { Context } from 'koa';
import pino from 'pino';
import type { EventToActivity, JsonToEvent } from '.';
import { ClientId } from '../generated';
import { inferAccount, inferAction, inferArtifact } from '../inference/githubInference';
import { getHeader } from '../middleware';
import { EventType, type Activity, type Event } from '../types';
import { githubEventSchema, type GitHubEventSchema } from '../types/githubSchema';
import {
  toCodeAction,
  toCommits,
  toPullRequest,
  toPullRequestComment,
  toRelease,
  toRepository,
} from '../types/githubSchemaAdapter';

const logger = pino({ name: 'adapters:github' });

export const gitHubJsonToEvent: JsonToEvent = (ctx: Context, clientId: ClientId, body: unknown) => {
  const now = Date.now();
  const createdAt = (body as GitHubEventSchema).hook?.created_at;
  const eventTimestamp = !createdAt ? now : Date.parse(createdAt);

  const targetType: string = ctx.request.get('X-GitHub-Hook-Installation-Target-Type');
  const targetId = +ctx.request.get('X-GitHub-Hook-Installation-Target-ID');

  const event: Event = {
    pluginName: 'github',
    contentLength: +getHeader(ctx, 'Content-Length'),
    instanceId: ctx.request.get('X-GitHub-Delivery') || `${eventTimestamp}`,
    customerId: clientId.customerId,
    feedId: clientId.feedId,
    senderAccount: (body as GitHubEventSchema).sender?.login,
    createTimestamp: now,
    eventTimestamp,
    name: getHeader(ctx, 'X-GitHub-Event'),
    hookId: getHeader(ctx, 'X-GitHub-Hook-ID'),
    ...(targetId && { targetId }),
    ...(targetType && { targetType }),
    properties: body as Event['properties'],
  };

  return event;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const githubEventToActivity: EventToActivity = (event: Event, eventStorageId: string) => {
  try {
    const props = githubEventSchema.parse(event.properties);

    const account = inferAccount(props);
    const codeAction = toCodeAction(props);

    const activity: Activity = {
      objectId: eventStorageId,
      eventType: EventType.github,
      event: event.name,
      createdTimestamp: event.createTimestamp,
      customerId: event.customerId,
      artifact: inferArtifact(event.name),
      actorAccountId: account?.id,
      action: inferAction(event.name, codeAction),
      priority: -1, // FIXME map it from the ticket collection
      initiative: '', // FIXME map initiative
      metadata: {
        ...(props.action && { codeAction: toCodeAction(props) }),
        ...(props.repository && { repository: toRepository(props.repository) }),
        ...(props.pull_request && { pullRequest: toPullRequest(props.pull_request) }),
        ...(props.comment && {
          pullRequestComment: toPullRequestComment(props.comment),
        }),
        ...(props.commits && { commits: toCommits(props.commits) }),
        ...(props.release && { release: toRelease(props.release) }),
      },
    };

    return { activity, account };
  } catch (e: unknown) {
    logger.error(e, 'githubEventToActivity failed');
    throw e;
  }
};
