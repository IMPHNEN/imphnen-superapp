import { A } from '@mobily/ts-belt';
import { AwsClient } from 'aws4fetch';
import { match } from 'ts-pattern';

const SERVICE = 's3';
const METHOD = { HEAD: 'HEAD', GET: 'GET', PUT: 'PUT' } as const;
const CONTENT_TYPE = 'content-type';
const NOT_FOUND = 404;
const PATH_SEPARATOR = '/';
const TRAILING_SLASH = /\/+$/;
const REQUEST_FAILED = 'object store request failed';

export type TObjectStore = {
  readonly exists: (key: string) => Promise<boolean>;
  readonly get: (key: string) => Promise<Uint8Array | null>;
  readonly put: (
    key: string,
    body: Uint8Array,
    contentType: string
  ) => Promise<void>;
};

export type TS3Config = {
  readonly endpoint: string;
  readonly region: string;
  readonly bucket: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
};

const objectUrl = (config: TS3Config, key: string): string =>
  `${config.endpoint.replace(TRAILING_SLASH, '')}${PATH_SEPARATOR}${encodeURIComponent(config.bucket)}${PATH_SEPARATOR}${A.join(A.map(key.split(PATH_SEPARATOR), encodeURIComponent), PATH_SEPARATOR)}`;

const failure = async (response: Response, key: string): Promise<Error> =>
  new Error(
    `${REQUEST_FAILED}: ${response.status} ${key} ${await response.text()}`
  );

const handled = <TValue>(
  response: Response,
  key: string,
  onOk: (response: Response) => Promise<TValue>,
  onMissing: () => Promise<TValue>
): Promise<TValue> =>
  match(response)
    .with({ status: NOT_FOUND }, (): Promise<TValue> => onMissing())
    .with({ ok: true }, (found): Promise<TValue> => onOk(found))
    .otherwise(async (found): Promise<TValue> => {
      throw await failure(found, key);
    });

export const s3Store = (config: TS3Config): TObjectStore => {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: SERVICE,
    region: config.region,
  });
  return {
    exists: async (key: string): Promise<boolean> =>
      handled(
        await client.fetch(objectUrl(config, key), { method: METHOD.HEAD }),
        key,
        async (): Promise<boolean> => true,
        async (): Promise<boolean> => false
      ),
    get: async (key: string): Promise<Uint8Array | null> =>
      handled(
        await client.fetch(objectUrl(config, key), { method: METHOD.GET }),
        key,
        async (found): Promise<Uint8Array | null> =>
          new Uint8Array(await found.arrayBuffer()),
        async (): Promise<Uint8Array | null> => null
      ),
    put: async (
      key: string,
      body: Uint8Array,
      contentType: string
    ): Promise<void> =>
      handled(
        await client.fetch(objectUrl(config, key), {
          method: METHOD.PUT,
          body,
          headers: { [CONTENT_TYPE]: contentType },
        }),
        key,
        async (): Promise<void> => undefined,
        async (): Promise<void> => {
          throw new Error(`${REQUEST_FAILED}: ${NOT_FOUND} ${key}`);
        }
      ),
  };
};

export const urlFetch = async (url: string): Promise<Uint8Array | null> => {
  const response = await fetch(url);
  return response.ok ? new Uint8Array(await response.arrayBuffer()) : null;
};
