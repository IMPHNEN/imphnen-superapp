import type { TPermission } from '@app/permissions';
import type { TRoleCreateInput, TRoleUpdateInput } from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { TBaseRow } from '#/shared/base-row.ts';
import type { EConflict, EDatabase } from '#/shared/errors.ts';
import type { TServiceId } from '#/shared/service-id.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';

export type TCustomRoleRow = TBaseRow & {
  key: string;
  label: string;
  description: string | null;
  permissions: readonly TPermission[];
  createdBy: string | null;
};

export type TRoleMemberCounts = Readonly<Record<string, number>>;

export type TCustomRoleRepo = {
  memberCounts: () => Effect.Effect<TRoleMemberCounts, EDatabase>;
  list: () => Effect.Effect<TCustomRoleRow[], EDatabase>;
  findByKey: (key: string) => Effect.Effect<TCustomRoleRow | null, EDatabase>;
  create: (
    input: TRoleCreateInput,
    createdBy: string
  ) => Effect.Effect<TCustomRoleRow, EDatabase | EConflict>;
  update: (
    input: TRoleUpdateInput
  ) => Effect.Effect<TCustomRoleRow | null, EDatabase>;
  remove: (key: string) => Effect.Effect<boolean, EDatabase>;
};

export type TCustomRoleRepoId = TServiceId<typeof REPO_TAG.CUSTOM_ROLE>;

export const CustomRoleRepo = Context.Service<
  TCustomRoleRepoId,
  TCustomRoleRepo
>(REPO_TAG.CUSTOM_ROLE);
