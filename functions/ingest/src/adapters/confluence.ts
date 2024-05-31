import { Context } from 'koa';
import pino from 'pino';
import type { EventToActivity, JsonToEvent } from '.';
import { ClientId } from '../generated';
import { inferAction, inferArtifact } from '../inference/confluenceInference';
import type { Activity, Event } from '../types';
import { confluenceEventSchema } from '../types/confluenceSchema';
import { toComment, toPage, toSpace } from '../types/confluenceSchemaAdapter';

const logger = pino({ name: 'adapters:confluence' });

export const confluenceJsonToEvent: JsonToEvent = (
  ctx: Context,
  clientId: ClientId,
  body: unknown
) => {
  const now = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  const { userAccountId, timestamp, ...properties } = body as any;

  const headerWebhookFlow = ctx.get('X-Atlassian-Webhook-Flow');

  const eventTimestamp = (timestamp as number) ?? now;
  const hookId = ctx.get('X-Atlassian-Webhook-Identifier');
  const instanceId = hookId ?? `${eventTimestamp}`;

  let name: string;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (properties.updateTrigger) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    name = properties.updateTrigger as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  } else if (properties.space) {
    name = 'space';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  } else if (properties.page) {
    name = 'page';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  } else if (properties.comment) {
    name = 'comment';
  } else {
    name = 'unknown';
  }
  const event: Event = {
    pluginName: 'confluence',
    contentLength: +ctx.get('Content-Length'),
    instanceId,
    customerId: clientId.customerId,
    feedId: clientId.feedId,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    senderAccount: userAccountId as string,
    createTimestamp: now,
    eventTimestamp,
    name,
    hookId,
    ...(headerWebhookFlow && { headers: { ['X-Atlassian-Webhook-Flow']: headerWebhookFlow } }),
    properties: properties as Event['properties'],
  };

  return event;
};

export const confluenceEventToActivity: EventToActivity = (
  event: Event,
  eventStorageId: string
) => {
  try {
    const props = confluenceEventSchema.parse(event.properties);

    const activity: Activity = {
      objectId: eventStorageId,
      event: event.name,
      createdTimestamp: event.createTimestamp,
      customerId: event.customerId,
      artifact: inferArtifact(),
      actorAccountId: event.senderAccount,
      action: inferAction(props),
      initiative: '', // FIXME map initiative
      metadata: {
        ...(props.space && { space: toSpace(props.space) }),
        ...(props.page && { page: toPage(props.page) }),
        ...(props.comment && { comment: toComment(props.comment) }),
      },
    };

    return { activity, account: { id: event.senderAccount ?? '' } };
  } catch (e: unknown) {
    logger.error(e, 'confluenceEventToActivity failed');
    throw e;
  }
};
