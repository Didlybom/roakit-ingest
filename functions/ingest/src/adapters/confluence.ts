import { Context } from 'koa';
import pino from 'pino';
import type { EventToActivity, JsonToEvent } from '.';
import { ClientId } from '../generated';
import { inferAction, inferArtifact } from '../inference/confluenceInference';
import { EventType, type Activity, type Event } from '../types';
import { confluenceEventSchema, type ConfluenceEventSchema } from '../types/confluenceSchema';
import {
  toAttachments,
  toComment,
  toLabel,
  toPage,
  toSpace,
} from '../types/confluenceSchemaAdapter';

const logger = pino({ name: 'adapters:confluence' });

export const confluenceJsonToEvent: JsonToEvent = (
  ctx: Context,
  clientId: ClientId,
  body: unknown
) => {
  const now = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { userAccountId, timestamp, ...properties } = body as ConfluenceEventSchema;

  const headerWebhookFlow = ctx.get('X-Atlassian-Webhook-Flow');

  const eventTimestamp = timestamp ?? now;
  const hookId = ctx.get('X-Atlassian-Webhook-Identifier');
  const instanceId = hookId || `${eventTimestamp}`;

  let name: string;

  if (properties.updateTrigger) {
    name = properties.updateTrigger;
  } else if (properties.space) {
    name = 'space';
  } else if (properties.page ?? properties.content?.contentType === 'page') {
    name = 'page';
  } else if (properties.content) {
    name = 'content';
  } else if (properties.comment) {
    name = 'comment';
  } else if (properties.attachedTo) {
    name = 'attachment';
  } else if (properties.labeled) {
    name = 'labeled';
  } else {
    name = 'unknown';
  }
  const event: Event = {
    pluginName: 'confluence',
    contentLength: +ctx.get('Content-Length'),
    instanceId,
    customerId: clientId.customerId,
    feedId: clientId.feedId,
    senderAccount: userAccountId!,
    createTimestamp: now,
    eventTimestamp,
    name,
    hookId,
    ...(headerWebhookFlow && { headers: { ['X-Atlassian-Webhook-Flow']: headerWebhookFlow } }),
    properties: body as Event['properties'],
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
      eventType: EventType.confluence,
      event: event.name,
      createdTimestamp: event.createTimestamp,
      customerId: event.customerId,
      artifact: inferArtifact(event.name),
      actorAccountId: event.senderAccount,
      action: inferAction(props),
      initiative: '', // FIXME map initiative
      metadata: {
        ...(props.space && { space: toSpace(props.space) }),
        ...(props.page && { page: toPage(props.page) }),
        ...(props.content?.contentType === 'page' && { page: toPage(props.content) }),
        ...(props.comment && { comment: toComment(props.comment) }),
        ...(props.attachedTo && { attachments: toAttachments(props) }),
        ...(props.labeled && { label: toLabel(props) }),
      },
    };

    return { activity, account: { id: event.senderAccount ?? '' } };
  } catch (e: unknown) {
    logger.error(e, 'confluenceEventToActivity failed');
    throw e;
  }
};
