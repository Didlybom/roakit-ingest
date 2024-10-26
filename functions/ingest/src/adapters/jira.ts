import { Context } from 'koa';
import type { EventToActivity, JsonToEvent } from '.';
import { ClientId } from '../generated';
import { inferAccount, inferAction, inferArtifact } from '../inference/jiraInference';
import { EventType, type Activity, type Event } from '../types';
import { jiraEventSchema, type JiraEventSchema } from '../types/jiraSchema';
import {
  toAttachment,
  toChangelog,
  toComment,
  toIssue,
  toPriority,
  toProject,
  toSprint,
  toTicket,
} from '../types/jiraSchemaAdapter';
import { getLogger } from '../utils/loggerUtils';

const logger = getLogger('adapters:jira');

export const jiraJsonToEvent: JsonToEvent = (ctx: Context, clientId: ClientId, body: unknown) => {
  const now = Date.now();
  const { webhookEvent: name, timestamp, ...properties } = body as JiraEventSchema;

  const headerWebhookFlow = ctx.get('X-Atlassian-Webhook-Flow');

  const eventTimestamp = timestamp ?? now;
  const hookId = ctx.get('X-Atlassian-Webhook-Identifier');
  const instanceId = hookId || `${eventTimestamp}`;

  const event: Event = {
    pluginName: 'jira',
    contentLength: +ctx.get('Content-Length'),
    instanceId,
    customerId: clientId.customerId,
    feedId: clientId.feedId,
    senderAccount: properties.user?.accountId,
    createTimestamp: now,
    eventTimestamp,
    name: name,
    hookId,
    ...(headerWebhookFlow && { headers: { ['X-Atlassian-Webhook-Flow']: headerWebhookFlow } }),
    properties: body as Event['properties'],
  };

  return event;
};

export const jiraEventToActivity: EventToActivity = (event: Event, eventStorageId: string) => {
  try {
    const props = jiraEventSchema.parse(event.properties);

    const account = inferAccount(props);

    const activity: Activity = {
      objectId: eventStorageId,
      eventType: EventType.jira,
      event: event.name,
      createdTimestamp: event.createTimestamp,
      eventTimestamp: event.eventTimestamp,
      customerId: event.customerId,
      artifact: inferArtifact(event.name),
      actorAccountId: account?.id,
      action: inferAction(event.name),
      priority: toPriority(props) ?? -1,
      initiative: '', // FIXME map initiative
      metadata: {
        ...(props.changelog && { changeLog: toChangelog(props.changelog) }),
        ...(props.project && { project: toProject(props.project) }),
        ...(props.issue && { issue: toIssue(props.issue) }),
        ...(props.comment && { comment: toComment(props.comment) }),
        ...(props.attachment && { attachment: toAttachment(props.attachment) }),
        ...(props.sprint && { sprint: toSprint(props.sprint) }),
      },
    };

    const ticket = props.issue ? toTicket(props.issue) : undefined;

    return { activity, account, ticket };
  } catch (e: unknown) {
    logger.error(e, 'jiraEventToActivity failed');
    throw e;
  }
};
