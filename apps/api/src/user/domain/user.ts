import type {
  TUserCreateInput,
  TUserListInput,
  TUserPasswordResetInput,
  TUserUpdateInput,
} from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { TBaseRow } from '#/shared/base-row.ts';
import type { EAuth, EConflict, EDatabase } from '#/shared/errors.ts';
import type { TRowPage } from '#/shared/pagination.ts';
import type { TServiceId } from '#/shared/service-id.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';

export type TUserRow = TBaseRow & {
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
};

export type TUserRepo = {
  list: (input: TUserListInput) => Effect.Effect<TRowPage<TUserRow>, EDatabase>;
  findById: (id: string) => Effect.Effect<TUserRow | null, EDatabase>;
  findByEmail: (email: string) => Effect.Effect<TUserRow | null, EDatabase>;
  create: (
    input: TUserCreateInput
  ) => Effect.Effect<TUserRow, EAuth | EConflict>;
  update: (
    input: TUserUpdateInput
  ) => Effect.Effect<TUserRow | null, EDatabase>;
  remove: (id: string) => Effect.Effect<boolean, EDatabase>;
  resetPassword: (input: TUserPasswordResetInput) => Effect.Effect<void, EAuth>;
};

export type TUserRepoId = TServiceId<typeof REPO_TAG.USER>;

export const UserRepo = Context.Service<TUserRepoId, TUserRepo>(REPO_TAG.USER);
