import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { createKoaService } from './service';

const service = createKoaService();

// see https://firebase.google.com/docs/functions
const ingest = onRequest(
  {
    cpu: 'gcf_gen1',
    invoker: 'public',
    region: 'us-west1',
    secrets: [defineSecret('CLIENT_ID_KEY')],
  },
  service.callback()
);

module.exports = { ingest };
