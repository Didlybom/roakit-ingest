import { createClientId, decodeClientId } from '../../utils/cryptoUtils';

test('decodeClientId', () => {
  const secret = 'secret';
  const encodedClientId = createClientId(secret, 100, 1);
  const decodedClientId = decodeClientId(Buffer.from(secret, 'base64'), encodedClientId);
  expect(decodedClientId.customerId).toEqual(100);
  expect(decodedClientId.feedId).toEqual(1);

  expect(() => decodeClientId(Buffer.from('wrong secret', 'base64'), encodedClientId)).toThrow();
});
