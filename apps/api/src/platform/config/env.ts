import { env as bindings } from 'cloudflare:workers';
import { envSchema, type TEnv } from '#/platform/config/env-schema.ts';

export type { TEnv } from '#/platform/config/env-schema.ts';

export type TBindings = Env;

let parsed: TEnv | null = null;

const envRead = (): TEnv => {
  parsed ??= envSchema.parse(bindings);
  return parsed;
};

export const env: TEnv = new Proxy({} as TEnv, {
  get: (_target, key: string): unknown => envRead()[key as keyof TEnv],
});

export { bindings };
