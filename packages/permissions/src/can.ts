import { A } from '@mobily/ts-belt';
import type { TPermission } from './permissions.ts';

export const canAll = (
  granted: readonly TPermission[],
  required: readonly TPermission[]
): boolean =>
  A.every(required, (permission) => A.includes(granted, permission));

export const canAny = (
  granted: readonly TPermission[],
  required: readonly TPermission[]
): boolean => A.some(required, (permission) => A.includes(granted, permission));
