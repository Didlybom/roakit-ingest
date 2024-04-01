import Router from '@koa/router';
import cfg from 'config';
import Koa from 'koa';
import packageJson from '../package.json';
import { eventMiddleware, signedEventMiddleware } from './middleware';
import { EventType } from './types';

export const createKoaService = () => {
  const gitHubEventHandler = signedEventMiddleware(
    cfg.get('github.signatureHeader'),
    new TextEncoder().encode(cfg.get('github.signatureSecret')),
    EventType.github
  );
  const jiraEventHandler = eventMiddleware(EventType.jira);

  const router = new Router();

  router.get('/', (ctx, next) => {
    ctx.body = { version: packageJson.version };
    return next();
  });

  router.post('/github/:clientId', gitHubEventHandler);
  router.post('/jira/:clientId', jiraEventHandler);

  const server = new Koa();
  // CLIENT_ID_KEY is undefined during firebase deploy check, hence the `?? ''`
  server.context.secret = Buffer.from(process.env.CLIENT_ID_KEY ?? '', 'base64');
  server.use(router.routes());

  return server;
};
