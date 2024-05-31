import { Context } from 'koa';
import { ClientId } from '../generated';
import type { Account, Activity, Event, Ticket } from '../types';
import { EventType } from '../types';
import { confluenceEventToActivity, confluenceJsonToEvent } from './confluence';
import { gitHubJsonToEvent, githubEventToActivity } from './github';
import { jiraEventToActivity, jiraJsonToEvent } from './jira';

export type JsonToEvent = (ctx: Context, clientId: ClientId, body: unknown) => Event;

export const jsonToEvent: Record<EventType, JsonToEvent> = {
  [EventType.github]: gitHubJsonToEvent,
  [EventType.jira]: jiraJsonToEvent,
  [EventType.confluence]: confluenceJsonToEvent,
};

export type EventToActivity = (
  event: Event,
  eventStorageId: string
) => { activity: Activity; account?: Account; ticket?: Ticket };

export const eventToActivity: Record<EventType, EventToActivity> = {
  [EventType.github]: githubEventToActivity,
  [EventType.jira]: jiraEventToActivity,
  [EventType.confluence]: confluenceEventToActivity,
};
