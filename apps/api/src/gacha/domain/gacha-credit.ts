import { Context, type Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TGachaCreditRow = {
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TGachaCreditRecipient = {
  id: string;
  name: string;
  email: string;
};

export type TGachaCreditRepo = {
  findByUser: (
    userId: string
  ) => Effect.Effect<TGachaCreditRow | null, EDatabase>;
  recipientFind: (
    userId: string
  ) => Effect.Effect<TGachaCreditRecipient | null, EDatabase>;
  grant: (
    userId: string,
    amount: number
  ) => Effect.Effect<TGachaCreditRow, EDatabase>;
};

export type TGachaCreditRepoId = TServiceId<typeof REPO_TAG.GACHA_CREDIT>;

export const GachaCreditRepo = Context.Service<
  TGachaCreditRepoId,
  TGachaCreditRepo
>(REPO_TAG.GACHA_CREDIT);
