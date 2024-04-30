import retry from 'async-retry';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import NodeCache from 'node-cache';
import pino from 'pino';
import type { Account, Activity, Event, IdentityMap, Ticket } from '../types';
import { identitySchema } from '../types/roakitSchema';
import { ONE_DAY } from '../utils/dateUtils';

const logger = pino({ name: 'firestore' });

if (getApps().length === 0) {
  initializeApp();
}

const firestore = getFirestore();
firestore.settings({ ignoreUndefinedProperties: true });

const retryProps = (message: string) => {
  return {
    // see https://github.com/tim-kos/node-retry#api
    retries: 1,
    factor: 2,
    minTimeout: 500,
    onRetry: (e: unknown) => logger.warn(e, message),
  };
};

const makeCacheKey = (customerId: number, feedId: number) => `${customerId};${feedId}`;

const bannedEventsCache = new NodeCache({ stdTTL: 30 /* seconds */, useClones: false });
const deleteBannedEventsCacheKey = (customerId: number, feedId: number) => {
  bannedEventsCache.del(makeCacheKey(customerId, feedId));
};

const bannedAccountsCache = new NodeCache({ stdTTL: 30 /* seconds */, useClones: false });

const identitiesCache = new NodeCache({ stdTTL: 30 /* seconds */, useClones: false });

export const getBannedEvents = async (
  customerId: number,
  feedId: number,
  options: { noCache: boolean } = { noCache: false }
): Promise<Record<string, boolean>> => {
  const cacheKey = makeCacheKey(customerId, feedId);
  if (!options?.noCache) {
    const cached: Record<string, boolean> | undefined = bannedEventsCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }
  const bannedEvents = await retry(async () => {
    const doc = await firestore.doc(`customers/${customerId}/feeds/${feedId}`).get();
    return (doc.get('bannedEvents') as Record<string, boolean>) ?? {};
  }, retryProps('Retrying getBannedEvents...')).catch(e => {
    logger.error(e, 'getBannedEvents failed');
    throw e;
  });
  bannedEventsCache.set(cacheKey, bannedEvents);
  return bannedEvents;
};

export const setUnbannedEventType = async (
  customerId: number,
  feedId: number,
  type: string,
  eventName: string
) => {
  deleteBannedEventsCacheKey(customerId, feedId);
  await firestore
    .doc(`customers/${customerId}/feeds/${feedId}`)
    .set({ ['bannedEvents']: { [eventName]: false }, id: feedId, type }, { merge: true })
    .catch(e => {
      logger.error(e, 'setUnbannedEventType failed');
      throw e;
    });
};

export const getBannedAccounts = async (
  customerId: number,
  feedId: number
): Promise<Record<string, boolean>> => {
  const cacheKey = makeCacheKey(customerId, feedId);
  const cached: Record<string, boolean> | undefined = bannedAccountsCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const bannedAccounts = await retry(async () => {
    const doc = await firestore.doc(`customers/${customerId}/feeds/${feedId}`).get();
    return (doc.get('bannedAccounts') as Record<string, boolean>) ?? {};
  }, retryProps('Retrying getBannedAccounts...')).catch(e => {
    logger.error(e, 'getBannedAccounts failed');
    throw e;
  });
  bannedAccountsCache.set(cacheKey, bannedAccounts);
  return bannedAccounts;
};

export const getIdentities = async (
  customerId: number,
  options: { noCache: boolean } = { noCache: false }
): Promise<IdentityMap> => {
  const cacheKey = customerId;
  if (!options?.noCache) {
    const cached: IdentityMap | undefined = identitiesCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }
  const identityDocs = await retry(
    async () => await firestore.collection(`customers/${customerId}/identities`).get(),
    retryProps('Retrying getIdentities...')
  ).catch(e => {
    logger.error(e, 'getIdentities failed');
    throw e;
  });
  const identities: IdentityMap = new Map();
  identityDocs.forEach(identity =>
    identities.set(identity.id, identitySchema.parse(identity.data()))
  );
  identitiesCache.set(cacheKey, identities);
  return identities;
};

export const insertAccountToReview = async (
  customerId: number,
  feedId: number,
  account: Account
) => {
  const doc = firestore
    .collection(`customers/${customerId}/feeds/${feedId}/accountsToReview`)
    .doc(account.id);
  if (!(await doc.get()).exists) {
    await doc.set({ createdDate: Date.now(), ...account }).catch(e => {
      logger.error(e, 'insertAccountToReview failed');
      throw e;
    });
  }
};

export const saveEvent = async (event: Event) => {
  await firestore
    .doc(
      `customers/${event.customerId}/feeds/${event.feedId}/events/${event.name}/instances/${event.instanceId}`
    )
    .set(event)
    .catch(e => {
      if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        e?.code === 3 ||
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ((e?.message as string) ?? '').indexOf('INVALID_ARGUMENT') !==
          -1 /* (e.g. exceeds the maximum allowed size) */
      ) {
        // event is not critical (it's a dupe of the gcs event in Firestore for debugging purposes), don't log as error and don't throw
        logger.warn(e, 'saveEvent failed with INVALID_ARGUMENT');
      } else {
        logger.error(e, 'saveEvent failed');
        throw e;
      }
    });
};

export const saveActivity = async (activity: Activity) => {
  const doc = await firestore
    .collection(`customers/${activity.customerId}/activities/`)
    .add(activity)
    .catch(e => {
      logger.error(e, 'saveActivity failed');
      throw e;
    });
  return doc.id;
};

export const saveAccount = async (account: Account, customerId: number, feedId: number) => {
  const accountDoc = firestore.doc(
    `customers/${customerId}/feeds/${feedId}/accounts/${account.id}`
  );
  const accountData = (await accountDoc.get()).data();
  const now = Date.now();
  const updating = !!accountData && (accountData.lastUpdatedTimestamp ?? 0) < now - ONE_DAY;
  if (updating || !accountData) {
    await accountDoc
      .set(
        {
          accountName: account.accountName,
          accountUri: account.accountUri,
          timeZone: account.timeZone,
          lastUpdatedTimestamp: now,
          ...(!accountData && { createdTimestamp: now }),
        },
        { merge: true }
      )
      .catch(e => {
        logger.error(e, 'saveAccount failed');
        throw e;
      });
  }
};

export const saveTicket = async (ticket: Ticket, customerId: number) => {
  const ticketDoc = firestore.doc(`customers/${customerId}/tickets/${ticket.key}`);
  const ticketData = (await ticketDoc.get()).data();
  const now = Date.now();
  await ticketDoc
    .set(
      {
        id: ticket.id,
        summary: ticket.summary,
        priority: ticket.priority,
        project: ticket.project,
        lastUpdatedTimestamp: now,
        ...(!ticketData && { createdTimestamp: now }),
      },
      { merge: true }
    )
    .catch(e => {
      logger.error(e, 'saveTicket failed');
      throw e;
    });
};
