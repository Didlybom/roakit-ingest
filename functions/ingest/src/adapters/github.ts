import { Context } from 'koa';
import pino from 'pino';
import type { EventToActivity, JsonToEvent } from '.';
import { ClientId } from '../generated';
import { getHeader } from '../middleware';
import type { Event } from '../types';
import { githubEventSchema } from '../types/githubSchema';
import { toAccount } from '../types/githubSchemaAdapter';

const logger = pino({ name: 'adapters:github' });

export const gitHubJsonToEvent: JsonToEvent = (ctx: Context, clientId: ClientId, body: unknown) => {
  const now = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const createdAt = (body as any).hook?.created_at as string;
  const eventTimestamp = !createdAt ? now : Date.parse(createdAt);

  const targetType: string = ctx.request.get('X-GitHub-Hook-Installation-Target-Type');
  const targetId = +ctx.request.get('X-GitHub-Hook-Installation-Target-ID');

  const event: Event = {
    pluginName: 'github',
    contentLength: +getHeader(ctx, 'Content-Length'),
    instanceId: ctx.request.get('X-GitHub-Delivery') || `${eventTimestamp}`,
    customerId: clientId.customerId,
    feedId: clientId.feedId,
    createTimestamp: now,
    eventTimestamp,
    name: getHeader(ctx, 'X-GitHub-Event'),
    hookId: getHeader(ctx, 'X-GitHub-Hook-ID'),
    ...(targetId && { targetId }),
    ...(targetType && { targetType }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: { ...(body as any) } as Event['properties'],
  };

  return event;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const githubEventToActivity: EventToActivity = (event: Event, eventStorageId: string) => {
  try {
    const props = githubEventSchema.parse(event.properties);

    const account = toAccount(props);

    //   const activity: Activity = {
    //     objectId: eventStorageId,
    //     event: event.name,
    //     createdTimestamp: event.createTimestamp,
    //     customerId: event.customerId,
    //     artifact: 'task', // FIXME task org,...
    //     actorAccountId: account?.id,
    //     action: toAction(event.name),
    //  //   priority: toPriority(props),
    //     initiative: '', // FIXME map initiative
    //     metadata: {},
    //   };

    return { activity: undefined, account };
  } catch (e: unknown) {
    logger.error(e, 'githubEventToActivity failed');
    throw e;
  }
};
