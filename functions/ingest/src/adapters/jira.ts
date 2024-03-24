import { Context } from 'koa';
import type { JsonToEvent } from '.';
import { ClientId } from '../generated';
import type { Event } from '../types';

export interface User {
  self: string;
  accountId: string;
  displayName?: string;
  emailAddress?: string;
  name?: string;
}

export const jiraJsonToEvent: JsonToEvent = (ctx: Context, clientId: ClientId, body: unknown) => {
  const now = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  const { webhookEvent: name, id, timestamp, ...properties } = body as any;

  const headerWebhookFlow = ctx.get('X-Atlassian-Webhook-Flow');

  const eventTimestamp = (timestamp as number) ?? now;
  const hookId = ctx.get('X-Atlassian-Webhook-Identifier');
  const instanceId = hookId ?? `${id ?? eventTimestamp}`;

  const event: Event = {
    pluginName: 'jira',
    contentLength: +ctx.get('Content-Length'),
    instanceId,
    customerId: clientId.customerId,
    feedId: clientId.feedId,
    createTimestamp: now,
    eventTimestamp,
    name: name as string,
    hookId,
    ...(headerWebhookFlow && { headers: { ['X-Atlassian-Webhook-Flow']: headerWebhookFlow } }),
    properties: properties as Event['properties'],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = event.properties?.user as User;
  if (user) {
    if (user.name) {
      event.username = `name:${user.name}`;
    } else if (user.accountId) {
      event.username = `id:${user.accountId}`;
    } else if (user.emailAddress) {
      event.username = `email:${user.emailAddress}`;
    } else if (user.displayName) {
      event.username = `alias:${user.displayName}`;
    } else if (user.self) {
      event.username = `self:${user.self}`;
    }
  }

  return event;
};
