import { Context } from 'koa';
import { ClientId } from '../generated';
import type { Account, Activity, Event } from '../types';
import { EventType } from '../types';
import { gitHubJsonToEvent } from './github';
import { jiraEventToActivity, jiraJsonToEvent } from './jira';

export type JsonToEvent = (ctx: Context, clientId: ClientId, body: unknown) => Event;

export const jsonToEvent: Record<EventType, JsonToEvent> = {
  [EventType.github]: gitHubJsonToEvent,
  [EventType.jira]: jiraJsonToEvent,
};

export type EventToActivity = (
  event: Event,
  eventStorageId: string
) => { activity?: Activity; account?: Account };

export const eventToActivity: Record<EventType, EventToActivity> = {
  [EventType.github]: () => {
    return { activity: undefined, account: undefined };
  }, // FIXME
  [EventType.jira]: jiraEventToActivity,
};
