import retry from 'async-retry';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import NodeCache from 'node-cache';
import pino from 'pino';
import type { Event } from '../types';

const logger = pino({ name: 'firestore' });

if (getApps().length === 0) {
  initializeApp();
}

const firestore = getFirestore();

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
  const cacheKey = bannedEventsCacheKey(customerId, feedId);
  const cached: Record<string, boolean> | undefined = bannedEventsCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const bannedEvents = await retry(
    async () => {
      const doc = await firestore
        .collection(`customers/${customerId}/feeds`)
        .doc(`${feedId}`)
        .get();
      return doc.get('bannedEvents') as Record<string, boolean>;
    },
    {
      ...retryProps,
      onRetry: e => logger.warn(`Retrying getBannedEvents... ${e.message}`),
    }
  );
  bannedEventsCache.set(cacheKey, bannedEvents, 10);
  return bannedEvents;
};

export const insertUnbannedEventType = async (
  customerId: number,
  feedId: number,
  type: string,
  eventName: string
) => {
  deleteBannedEventsCacheKey(customerId, feedId);
  await retry(
    async () => {
      await firestore
        .collection(`customers/${customerId}/feeds`)
        .doc(`${feedId}`)
        .set({ ['bannedEvents']: { [eventName]: false }, id: feedId, type });
    },
    {
      ...retryProps,
      onRetry: e => logger.warn(`Retrying insertUnbannedEventType... ${e.message}`),
    }
  );
};

export const updateUnbannedEventType = async (
  customerId: number,
  feedId: number,
  eventName: string
) => {
  deleteBannedEventsCacheKey(customerId, feedId);
  await retry(
    async () => {
      await firestore
        .collection(`customers/${customerId}/feeds`)
        .doc(`${feedId}`)
        .update(`bannedEvents.${eventName}`, false);
    },
    {
      ...retryProps,
      onRetry: e => logger.warn(`Retrying updateUnbannedEventType... ${e.message}`),
    }
  );
};

export const saveEvent = async (event: Event) => {
  await retry(
    async () => {
      await firestore
        .collection(
          `customers/${event.customerId}/feeds/${event.feedId}/events/${event.name}/instances/`
        )
        .doc(event.instanceId)
        .set(event);
    },
    {
      ...retryProps,
      onRetry: e => logger.warn(`Retrying saveEvent... ${e.message}`),
    }
  );
};
