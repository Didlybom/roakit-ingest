import { Context, Next } from 'koa';
import pino from 'pino';
import { eventToActivity, jsonToEvent } from './adapters';
import { gcsSaveEvent } from './cloudstore';
import {
  getBannedEvents,
  insertUnbannedEventType,
  saveAccount,
  saveActivity,
  saveEvent,
  updateUnbannedEventType,
} from './firestore';
import type { Event, EventType } from './types';
import { decodeClientId, verifyHmacSignature } from './utils/cryptoUtils';

const logger = pino({ name: 'middleware' });

export const deserializeClientId = (ctx: Context) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const encodedClientId: string | undefined = (ctx.request as any).params.clientId as string;
  if (!encodedClientId) {
    logger.error('Missing client id');
    ctx.throw(403 /* Forbidden */, 'Missing client Id');
  }
  try {
    return decodeClientId(ctx.secret as Buffer, encodedClientId);
  } catch (e) {
    logger.error(e, 'Failed to decode client id');
    ctx.throw(403 /* Forbidden */, 'Invalid Client Id');
  }
};

const handleBannedEvents = async (
  bannedEvents: Record<string, boolean>,
  eventType: string,
  event: Event
) => {
  if (event.name in bannedEvents) {
    if (bannedEvents[event.name]) {
      return { banned: true };
    }
    return { banned: false };
  }

  if (!Object.keys(bannedEvents).length) {
    await insertUnbannedEventType(event.customerId, event.feedId, eventType, event.name);
  } else {
    await updateUnbannedEventType(event.customerId, event.feedId, event.name);
  }
  return { banned: false };
};

export const eventMiddleware = (eventType: EventType) => async (ctx: Context, next: Next) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const body = (ctx.req as any).body as unknown;
  if (!body) {
    ctx.throw(400 /* Bad request */, 'Empty body');
  }

  const clientId = deserializeClientId(ctx);
  const event = jsonToEvent[eventType](ctx, clientId, body);

  try {
    const bannedEvents: Record<string, boolean> = await getBannedEvents(
      event.customerId,
      event.feedId
    );
    const { banned } = await handleBannedEvents(bannedEvents, eventType, event);
    const { eventStorageId } = await gcsSaveEvent({ ...event, banned });
    if (!banned) {
      await saveEvent(event);
      const { activity, account } = eventToActivity[eventType](event, eventStorageId);
      if (activity) {
        await Promise.all([
          saveActivity(activity),
          saveAccount(account, event.customerId, event.feedId),
        ]);
      }
      ctx.status = 202 /* Accepted */;
    } else {
      ctx.status = 200 /* OK */;
    }
    await next();
  } catch (e: unknown) {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    ctx.status = ((e as any).status as number) ?? 500;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    ctx.body = { error: true, message: (e as any).message as string };
  }
};

export const signedEventMiddleware =
  (headerName: string, secret: Uint8Array, eventType: EventType) => (ctx: Context, next: Next) => {
    verifyHmacSignature(headerName, secret, ctx);
    return eventMiddleware(eventType)(ctx, next);
  };

export const getHeader = (ctx: Context, headerName: string) => {
  const header = ctx.get(headerName);
  if (!header) {
    ctx.throw(400 /* Bad request */, `Missing header ${headerName}`);
  }
  return header;
};
