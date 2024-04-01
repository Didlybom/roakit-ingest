import crypto from 'crypto';
import { Context } from 'koa';
import pino from 'pino';
import { ClientId } from '../generated';

const logger = pino({ name: 'cryptoUtils' });

const ALGORITHM = 'sha256';
const CHECKSUM_LENGTH = 12;
const HEX_ENCODING: crypto.BinaryToTextEncoding = 'hex';

export const verifyHmacSignature = (headerName: string, secret: Uint8Array, ctx: Context) => {
  if (ctx.request.is(['application/json']) !== 'application/json') {
    logger.error('Received request not application/json');
    ctx.throw(415 /* Unsupported Media Type */, 'Content-Type must be application/json');
  }
  const signature = ctx.request.get(headerName);
  if (!signature) {
    logger.error('Received request missing signature');
    ctx.throw(400 /* Bad request */, `Missing "${headerName}" header`);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  const body = (ctx.req as any).rawBody as Buffer;

  const digest = crypto.createHmac(ALGORITHM, secret).update(body).digest(HEX_ENCODING);
  if (
    crypto.timingSafeEqual(
      Buffer.from(`sha256=${digest}`, 'ascii'),
      Buffer.from(signature, 'ascii')
    )
  ) {
    return;
  }

  logger.error(`Request signature hash <${signature}> doesn't match body hash <sha256=${digest}>`);
  ctx.throw(400 /* Bad request */, `Invalid ${headerName}`);
};

export const decodeClientId = (secretKey: Buffer, encodedClientId: string) => {
  const payload = ClientId.deserializeBinary(Buffer.from(encodedClientId, 'base64url'));

  const clientId = new ClientId();
  clientId.customerId = payload.customerId;
  clientId.feedId = payload.feedId;
  // omit checksum from the payload

  const checksum = crypto
    .createHmac(ALGORITHM, secretKey)
    .update(clientId.serializeBinary())
    .digest(HEX_ENCODING)
    .substring(0, CHECKSUM_LENGTH);

  if (checksum !== payload.checksum) {
    logger.error('Received request with invalid clientId');
    throw new Error('Invalid checksum');
  }

  return clientId;
};
