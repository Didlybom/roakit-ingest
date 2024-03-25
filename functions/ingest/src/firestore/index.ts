import retry from 'async-retry';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import NodeCache from 'node-cache';
import pino from 'pino';
import type { Account, Activity, Event } from '../types';
import { ONE_DAY } from '../utils/dateUtils';

const logger = pino({ name: 'firestore' });

if (getApps().length === 0) {
  initializeApp();
}

const firestore = getFirestore();
firestore.settings({ ignoreUndefinedProperties: true });

const retryProps = {
  // see https://github.com/tim-kos/node-retry#api
  retries: 2,
  factor: 2,
  minTimeout: 500,
};

const bannedEventsCache = new NodeCache({ stdTTL: 10 /* seconds */, useClones: false });
const bannedEventsCacheKey = (customerId: number, feedId: number) => customerId + ';' + feedId;
const deleteBannedEventsCacheKey = (customerId: number, feedId: number) => {
  bannedEventsCache.del(bannedEventsCacheKey(customerId, feedId));
};

export const getBannedEvents = async (
  customerId: number,
  feedId: number
): Promise<Record<string, boolean>> => {
  try {
    const cacheKey = bannedEventsCacheKey(customerId, feedId);
    const cached: Record<string, boolean> | undefined = bannedEventsCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const bannedEvents = await retry(
      async () => {
        const doc = await firestore.doc(`customers/${customerId}/feeds/${feedId}`).get();
        return doc.get('bannedEvents') as Record<string, boolean>;
      },
      {
        ...retryProps,
        onRetry: e => logger.warn(`Retrying getBannedEvents... ${e.message}`),
      }
    );
    bannedEventsCache.set(cacheKey, bannedEvents, 10);
    return bannedEvents;
  } catch (e: unknown) {
    logger.error(e, 'getBannedEvents failed');
    throw e;
  }
};

export const insertUnbannedEventType = async (
  customerId: number,
  feedId: number,
  type: string,
  eventName: string
) => {
  try {
    deleteBannedEventsCacheKey(customerId, feedId);
    await retry(
      async () => {
        await firestore
          .doc(`customers/${customerId}/feeds/${feedId}`)
          .set({ ['bannedEvents']: { [eventName]: false }, id: feedId, type });
      },
      {
        ...retryProps,
        onRetry: e => logger.warn(`Retrying insertUnbannedEventType... ${e.message}`),
      }
    );
  } catch (e: unknown) {
    logger.error(e, 'updateUnbannedEventType failed');
    throw e;
  }
};

export const updateUnbannedEventType = async (
  customerId: number,
  feedId: number,
  eventName: string
) => {
  try {
    deleteBannedEventsCacheKey(customerId, feedId);
    await retry(
      async () => {
        await firestore
          .doc(`customers/${customerId}/feeds/${feedId}`)
          .update(`bannedEvents.${eventName}`, false);
      },
      {
        ...retryProps,
        onRetry: e => logger.warn(`Retrying updateUnbannedEventType... ${e.message}`),
      }
    );
  } catch (e: unknown) {
    logger.error(e, 'updateUnbannedEventType failed');
    throw e;
  }
};

export const saveEvent = async (event: Event) => {
  try {
    await retry(
      async () => {
        await firestore
          .doc(
            `customers/${event.customerId}/feeds/${event.feedId}/events/${event.name}/instances/${event.instanceId}`
          )
          .set(event);
      },
      {
        ...retryProps,
        onRetry: e => logger.warn(`Retrying saveEvent... ${e.message}`),
      }
    );
  } catch (e: unknown) {
    logger.error(e, 'saveEvent failed');
    throw e;
  }
};

export const saveActivity = async (activity: Activity) => {
  try {
    await retry(
      async () => {
        await firestore.collection(`customers/${activity.customerId}/activities/`).add(activity);
      },
      {
        ...retryProps,
        onRetry: e => logger.warn(`Retrying saveActivity... ${e.message}`),
      }
    );
  } catch (e: unknown) {
    logger.error(e, 'saveActivity failed');
    throw e;
  }
};

export const saveAccount = async (account: Account, customerId: number, feedId: number) => {
  try {
    await retry(
      async () => {
        const accountDoc = firestore.doc(
          `customers/${customerId}/feeds/${feedId}/accounts/${account.id}`
        );
        const accountData = (await accountDoc.get()).data();
        const now = Date.now();
        const updating = !!accountData && (accountData.lastUpdatedTimestamp ?? 0) < now - ONE_DAY;
        await accountDoc.set(
          {
            accountName: account.accountName,
            accountUri: account.accountUri,
            timeZone: account.timeZone,
            ...((updating || !accountData) && { lastUpdatedTimestamp: now }),
            ...(!accountData && { createdTimestamp: now }),
          },
          { merge: true }
        );
      },
      {
        ...retryProps,
        onRetry: e => logger.warn(`Retrying saveAccount... ${e.message}`),
      }
    );
  } catch (e: unknown) {
    logger.error(e, 'saveAccount failed');
    throw e;
  }
};
