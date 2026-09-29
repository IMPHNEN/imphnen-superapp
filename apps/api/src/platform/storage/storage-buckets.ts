import { A } from '@mobily/ts-belt';
import { bindings } from '#/platform/config/env.ts';

export const PRIVATE_KEY_PREFIXES: readonly string[] = ['mentor/'];

export const isPrivateKey = (key: string): boolean =>
  A.some(PRIVATE_KEY_PREFIXES, (prefix) => key.startsWith(prefix));

export const bucketFor = (key: string): R2Bucket =>
  isPrivateKey(key) ? bindings.PRIVATE_STORAGE : bindings.STORAGE;
