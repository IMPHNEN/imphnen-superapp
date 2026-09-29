import type { Hono } from 'hono';
import { bindings, env } from '#/platform/config/env.ts';
import { ENVIRONMENT } from '#/platform/config/env-schema.ts';
import { HTTP_STATUS } from '#/platform/http/http-status.ts';
import { isPrivateKey } from '#/platform/storage/storage-buckets.ts';

const FILES_PREFIX = '/files/';
const CONTENT_TYPE = 'content-type';
const OCTET_STREAM = 'application/octet-stream';

export const devFilesMount = (app: Hono): void => {
  app.get(`${FILES_PREFIX}*`, async (context) => {
    const key = decodeURIComponent(context.req.path.slice(FILES_PREFIX.length));
    if (env.ENVIRONMENT === ENVIRONMENT.PRODUCTION || isPrivateKey(key)) {
      return context.notFound();
    }
    const object = await bindings.STORAGE.get(key);
    if (object === null) return context.notFound();
    return new Response(object.body, {
      status: HTTP_STATUS.OK,
      headers: {
        [CONTENT_TYPE]: object.httpMetadata?.contentType ?? OCTET_STREAM,
      },
    });
  });
};
