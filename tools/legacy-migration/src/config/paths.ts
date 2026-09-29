import { fileURLToPath } from 'node:url';

export const PACKAGE_DIR = fileURLToPath(new URL('../../', import.meta.url));
export const API_DIR = fileURLToPath(
  new URL('../../../../apps/api/', import.meta.url)
);
export const DEFAULT_OUT_DIR = fileURLToPath(
  new URL('../../out/', import.meta.url)
);
export const MIGRATIONS_DIR = fileURLToPath(
  new URL('../../../../apps/api/drizzle/', import.meta.url)
);
