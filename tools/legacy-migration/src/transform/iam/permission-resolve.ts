import { ALL_PERMISSIONS, type TPermission } from '@app/permissions';
import { A } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import { jsonParse } from '../../shared/json-text.ts';
import {
  ADMINISTRATOR,
  LEGACY_PERMISSIONS,
  type TLegacyPermission,
} from './legacy-permission.ts';

export type TPermissionResolution = {
  readonly administrator: boolean;
  readonly keys: readonly TPermission[];
  readonly unmapped: readonly string[];
};

export const storedPermissionsOf = (text: string | null): readonly unknown[] =>
  match(text === null ? null : jsonParse(text))
    .with(
      { ok: true, value: P.array() },
      (parsed): readonly unknown[] => parsed.value as readonly unknown[]
    )
    .otherwise((): readonly unknown[] => []);

const legacyPermissionOf = (value: string): TLegacyPermission | undefined =>
  A.find(LEGACY_PERMISSIONS, (entry): boolean => entry.id === value) ??
  A.find(LEGACY_PERMISSIONS, (entry): boolean => entry.name === value) ??
  undefined;

const isAdministrator = (value: unknown): boolean =>
  value === ADMINISTRATOR.id || value === ADMINISTRATOR.name;

export const catalogOrdered = (
  keys: readonly TPermission[]
): readonly TPermission[] =>
  A.filter(ALL_PERMISSIONS, (permission): boolean =>
    A.includes(keys, permission)
  );

const unmappedOf = (value: unknown): string | undefined =>
  match(value)
    .when(isAdministrator, (): undefined => undefined)
    .with(P.string, (text): string | undefined =>
      legacyPermissionOf(text) === undefined ? text : undefined
    )
    .otherwise((other): string => JSON.stringify(other));

export const permissionsResolve = (
  stored: readonly unknown[]
): TPermissionResolution => {
  const known = A.filterMap(stored, (value): TLegacyPermission | undefined =>
    typeof value === 'string' ? legacyPermissionOf(value) : undefined
  );
  return {
    administrator: A.some(stored, isAdministrator),
    keys: catalogOrdered(
      A.flat(A.map(known, (entry): readonly TPermission[] => entry.keys))
    ),
    unmapped: A.filterMap(stored, unmappedOf),
  };
};
