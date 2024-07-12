import retry from 'async-retry';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import type { Event } from '../types';
import { hourBucket } from '../utils/dateUtils';
import { getLogger } from '../utils/loggerUtils';

const logger = getLogger('cloudstore');

if (getApps().length === 0) {
  initializeApp();
}

const gcs = getStorage();
const bucket = gcs.bucket();

const retryProps = {
  // see https://github.com/tim-kos/node-retry#api
  retries: 1,
  factor: 2,
  minTimeout: 500,
};

const escapeFilePart = (str: string) => str.replaceAll('%', '%25').replaceAll('/', '%2F');

export const gcsSaveEvent = async (event: Event): Promise<{ eventStorageId: string }> => {
  const name =
    'v1/c/' +
    event.customerId +
    '/f/' +
    event.feedId +
    '/h/' +
    hourBucket(event.eventTimestamp) +
    '/e/' +
    escapeFilePart(event.name) +
    '/i/' +
    escapeFilePart(event.instanceId);

  return await retry(
    async () => {
      await bucket.file(name).save(JSON.stringify(event), {
        contentType: 'application/json',
        gzip: true,
        resumable: false,
      });
      return { eventStorageId: `${bucket.id}/${name}` };
    },
    {
      ...retryProps,
      onRetry: e => logger.warn(`Retrying gcsSaveEvent... ${e.message}`),
    }
  );
};

export const gcsEventInstances = async (prefix: string) => {
  const [files] = await bucket.getFiles({ prefix: prefix + '/i' });
  return Promise.all(
    files.map(async file => {
      const [content] = await bucket.file(file.name).download();
      return {
        storageId: bucket.id + '/' + file.name,
        event: JSON.parse(Buffer.from(content).toString()) as Event,
      };
    })
  );
};
