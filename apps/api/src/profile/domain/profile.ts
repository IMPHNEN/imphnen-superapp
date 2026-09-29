import type { TProfileExtension, TProfileUpdateInput } from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { TBaseRow } from '#/shared/base-row.ts';
import type { EDatabase } from '#/shared/errors.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TProfileUserRow = TBaseRow & {
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
};

export type TProfileExtensionRow = Omit<
  TProfileExtension,
  'skills' | 'experience' | 'education'
> & {
  avatarKey: string | null;
  skills: readonly TProfileExtension['skills'][number][];
  experience: readonly TProfileExtension['experience'][number][];
  education: readonly TProfileExtension['education'][number][];
};

export type TProfileRow = {
  user: TProfileUserRow;
  extension: TProfileExtensionRow | null;
};

export type TAvatar = {
  readonly key: string;
  readonly url: string;
};

export type TProfileRepo = {
  findByUserId: (
    userId: string
  ) => Effect.Effect<TProfileRow | null, EDatabase>;
  update: (
    userId: string,
    input: TProfileUpdateInput
  ) => Effect.Effect<TProfileRow | null, EDatabase>;
  avatarSet: (
    userId: string,
    avatar: TAvatar
  ) => Effect.Effect<string | null, EDatabase>;
};

export type TProfileRepoId = TServiceId<typeof REPO_TAG.PROFILE>;

export const ProfileRepo = Context.Service<TProfileRepoId, TProfileRepo>(
  REPO_TAG.PROFILE
);
