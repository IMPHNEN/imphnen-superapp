import type { TMigrationOptions } from '../pipeline/step-types.ts';

const ID_WIDTH = 12;
const PAD = '0';
const ID_PREFIX = '00000000-0000-4000-8000-';

export const fixtureId = (n: number): string =>
  `${ID_PREFIX}${String(n).padStart(ID_WIDTH, PAD)}`;

export const at = (iso: string): number => Date.parse(iso);

export const T0 = at('2025-01-10T08:00:00.000Z');
export const T1 = at('2025-02-01T09:30:00.000Z');
export const T2 = at('2025-03-05T12:00:00.000Z');
export const NOW = at('2026-09-29T00:00:00.000Z');

export const LEGACY_CDN_PREFIX = 'https://cdn.imphnen.dev/imphnen-uploads/';
export const STORAGE_PUBLIC_URL = 'https://storage.imphnen.dev';

export const FIXTURE_OPTIONS: TMigrationOptions = {
  now: NOW,
  storagePublicUrl: STORAGE_PUBLIC_URL,
  legacyFileUrlPrefixes: [LEGACY_CDN_PREFIX],
  gachaZeroStockUnpooled: false,
  gachaRetireTestItem: false,
};
