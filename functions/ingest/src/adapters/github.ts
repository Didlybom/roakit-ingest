import { Context } from 'koa';
import type { JsonToEvent } from '.';
import { ClientId } from '../generated';
import { getHeader } from '../middleware';
import type { Event } from '../types';
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
