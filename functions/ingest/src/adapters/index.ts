import { Context } from 'koa';
import { ClientId } from '../generated';
import type { Event } from '../types';
import { EventType } from '../types';
import { gitHubJsonToEvent } from './github';
import { jiraJsonToEvent } from './jira';

export type JsonToEvent = (ctx: Context, clientId: ClientId, body: unknown) => Event;

export const jsonToEvent: Record<EventType, JsonToEvent> = {
  [EventType.github]: gitHubJsonToEvent,
  [EventType.jira]: jiraJsonToEvent,
};
