import { Context } from 'koa';
import pino from 'pino';
import type { EventToActivity, JsonToEvent } from '.';
import { ClientId } from '../generated';
import type { Activity, Event, EventUser } from '../types';
import { jiraEventSchema, mapEventUser } from '../types/jiraSchema';
import {
  toAccount,
  toAction,
  toAttachment,
  toChangelog,
  toComment,
  toIssue,
  toPriority,
} from '../types/jiraSchemaAdapter';

const logger = pino({ name: 'adapters:jira' });

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
    username: mapEventUser((properties as Event['properties'])?.user as EventUser),
    ...(headerWebhookFlow && { headers: { ['X-Atlassian-Webhook-Flow']: headerWebhookFlow } }),
    properties: properties as Event['properties'],
  };

  return event;
};

export const jiraEventToActivity: EventToActivity = (event: Event, eventStorageId: string) => {
  try {
    const props = jiraEventSchema.parse(event.properties);

    const account = toAccount(props);

    const activity: Activity = {
      objectId: eventStorageId,
      event: event.name,
      createdTimestamp: event.createTimestamp,
      customerId: event.customerId,
      artifact: 'task', // FIXME task org,...
      actorAccountId: account?.id,
      action: toAction(event.name),
      priority: toPriority(props),
      initiative: '', // FIXME map initiative
      metadata: {
        ...(props.changelog && { changeLog: toChangelog(props.changelog) }),
        ...(props.issue && { issue: toIssue(props.issue) }),
        ...(props.comment && { comment: toComment(props.comment) }),
        ...(props.attachment && { attachment: toAttachment(props.attachment) }),
      },
    };

    return { activity, account };
  } catch (e: unknown) {
    logger.error(e, 'jiraEventToActivity failed');
    throw e;
  }
};
