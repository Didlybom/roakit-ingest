# ROAKIT Ingest webhook listener

A simple [Koa](https://koajs.com) webhook listener adapting Jira, GetHub, Confluence, etc. feeds
into Firestore and GCS.

See also the companion project, `@roakit/remix`, a fullstack web app, consuming the data ingested by
this project in its backend for frontend and serving it to web pages.

### Architecture

[High-level system architecture ](https://docs.google.com/drawings/d/1RmzvH6djX6aSpKaVxJvNUvPZgK6_3px8HvpOOxWrcIc)
designed for rapid product exploration and iteration.

## Developer Notes

### Local Deployment

To run locally without writing to the stores, run `npm run watch` (to automatically redeploy on
changes) and `npm run local:no-write`.

### Environments

- `eternal_impulse-412418` is the dev/stage project.
- `roakit-production` is the production project.

The `CLIENT_ID_KEY` secret is read from
[Google Secret Management](https://console.cloud.google.com/security/secret-manager).

### Cloud Deployment

- Go to [functions/ingest](functions/ingest) and `npm run deploy` (stage) or `npm run deploy:prod`
  (prod).
