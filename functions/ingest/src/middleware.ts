import { Context, Next } from 'koa';
import pino from 'pino';
import { eventToActivity, jsonToEvent } from './adapters';
import { gcsEventInstances, gcsSaveEvent } from './cloudstore';
import {
  getBannedAccounts,
  getBannedEvents,
  getIdentities,
  insertAccountToReview,
  overwriteActivityByGcsId,
  saveAccount,
  saveActivity,
  saveTicket,
  setUnbannedEventType,
} from './firestore';
import {
  Account,
  FEEDS,
  findIdentity,
  type Event,
  type EventType,
  type IdentityMap,
} from './types';
import { decodeClientId, verifyHmacSignature } from './utils/cryptoUtils';
import { getHourBuckets } from './utils/dateUtils';

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
  let banned = false;
  let foundSetting = false;

  // simple event, e.g. pull_request: false
  if (event.name in bannedEvents) {
    foundSetting = true;
    banned = bannedEvents[event.name];
  }

  // event with action, e.g. pull_request[action=synchronize]: true
  if (
    !banned &&
    event.properties?.action &&
    event.name + `[action=${event.properties.action as string}]` in bannedEvents
  ) {
    banned = true;
  }

  // add event to settings (as unbanned) if not there yet
  if (!foundSetting) {
    await setUnbannedEventType(event.customerId, event.feedId, eventType, event.name);
  }

  // "ban" pushes without commits (tags,...)
  if (
    eventType === 'github' &&
    event.name === 'push' &&
    !(event.properties?.commits as [])?.length
  ) {
    banned = true;
  }

  // "ban" tags and branches
  if (
    eventType === 'github' &&
    event.name === 'create' &&
    (event.properties?.ref_type === 'tag' || event.properties?.ref_type === 'branch')
  ) {
    banned = true;
  }

  // "ban" confluence noise
  if (
    eventType === 'confluence' &&
    event.properties?.type ===
      'com.atlassian.confluence.plugins.confluence-content-property-storage:content-property'
  ) {
    banned = true;
  }

  return { banned };
};

const handleBannedAccounts = (bannedAccounts: Record<string, boolean>, event: Event) => {
  if (!event.senderAccount) {
    return { banned: false };
  }
  if (event.senderAccount in bannedAccounts) {
    if (bannedAccounts[event.senderAccount]) {
      return { banned: true };
    }
    return { banned: false };
  }
  return { banned: false };
};

const handleIdentities = async (
  customerId: number,
  feedId: number,
  identities: IdentityMap,
  account: Account
) => {
  let foundIdentity = findIdentity(identities, feedId, account.id);
  if (!foundIdentity) {
    const freshIdentities = await getIdentities(customerId, { noCache: true });
    foundIdentity = findIdentity(freshIdentities, feedId, account.id);
  }
  if (!foundIdentity) {
    await insertAccountToReview(customerId, feedId, account);
  }
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
    const [bannedEvents, bannedAccounts, identities] = await Promise.all([
      getBannedEvents(event.customerId, event.feedId),
      getBannedAccounts(event.customerId, event.feedId),
      getIdentities(event.customerId),
    ]);
    let { banned } = await handleBannedEvents(bannedEvents, eventType, event);
    if (!banned) {
      banned = handleBannedAccounts(bannedAccounts, event).banned;
    }
    const { eventStorageId } = await gcsSaveEvent({ ...event, banned });

    if (!banned) {
      const { activity, account, ticket } = eventToActivity[eventType](event, eventStorageId);
      if (account) {
        await handleIdentities(event.customerId, event.feedId, identities, account);
      }
      if (activity) {
        await Promise.all([
          saveActivity(activity),
          ...(account ? [saveAccount(account, event.customerId, event.feedId)] : []),
          ...(ticket ? [saveTicket(ticket, event.customerId)] : []),
        ]);
      }
      ctx.status = 202 /* Accepted */;
    } else {
      ctx.status = 200 /* OK */;
    }
    await next();
  } catch (e: unknown) {
    logger.error(e, 'eventMiddleware failed');
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

interface gcsEventRequest {
  events: string[];
  dateStart: string;
  dateEnd: string;
}

export const gcsEventMiddleware = () => async (ctx: Context, next: Next) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const body = (ctx.req as any).body as unknown;
  if (!body) {
    ctx.throw(400 /* Bad request */, 'Empty body');
  }
  const request = body as gcsEventRequest;

  const clientId = deserializeClientId(ctx);
  if (clientId.feedId !== 0) {
    logger.error(`Unexpected feedId in GCS client id (${clientId.feedId})`);
    ctx.throw(403 /* Forbidden */, 'Invalid Client Id');
  }
  const customerId = clientId.customerId;
  try {
    const hourBuckets = getHourBuckets(request.dateStart, request.dateEnd);

    if (hourBuckets.length === 0) {
      ctx.throw(400 /* Bad request */, 'Empty date range');
    }

    const bannedEvents = await Promise.all(
      FEEDS.map(async feed => ({
        feedId: feed.id,
        events: await getBannedEvents(customerId, feed.id, { noCache: true }),
      }))
    );

    const gcsEventDirs: string[] = [];
    FEEDS.forEach(feed => {
      const bannedFeedEvents = bannedEvents.find(e => (e.feedId = feed.id))?.events ?? {};
      const gcsFeedDir = 'v1/c/' + customerId + '/f/' + feed.id + '/';
      hourBuckets.forEach(h => {
        const gcsHourDir = gcsFeedDir + 'h/' + h + '/';
        request.events.forEach(e => {
          if (!bannedFeedEvents[e]) {
            const gcsEventDir = gcsHourDir + 'e/' + e;
            gcsEventDirs.push(gcsEventDir);
          }
        });
      });
    });
    // FIXME NOT TESTED with numerous buckets, Promise.all might make the server explode
    const writtenActivityIds: string[] = [];
    await Promise.all(
      gcsEventDirs.map(async prefix => {
        const instances: { storageId: string; event: Event }[] = await gcsEventInstances(prefix);
        await Promise.all(
          instances.map(async instance => {
            const { activity } = eventToActivity[instance.event.pluginName as EventType](
              instance.event,
              instance.storageId
            );
            writtenActivityIds.push(await overwriteActivityByGcsId(activity));
          })
        );
      })
    );

    ctx.body = { writtenActivityIds };
    ctx.status = 200 /* OK */;

    await next();
  } catch (e: unknown) {
    logger.error(e, 'gcsEventMiddleware failed');
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    ctx.status = ((e as any).status as number) ?? 500;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    ctx.body = { error: true, message: (e as any).message as string };
  }
};

export const getHeader = (ctx: Context, headerName: string) => {
  const header = ctx.get(headerName);
  if (!header) {
    logger.error(`Received request with missing header ${headerName}`);
    ctx.throw(400 /* Bad request */, `Missing header ${headerName}`);
  }
  return header;
};
