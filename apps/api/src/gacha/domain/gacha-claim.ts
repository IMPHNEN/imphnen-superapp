import type {
  TGachaClaimListInput,
  TGachaClaimMineInput,
  TGachaClaimSource,
  TGachaClaimStatus,
} from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { TBaseRow } from '#/shared/base-row.ts';
import type { EDatabase } from '#/shared/errors.ts';
import type { TRowPage } from '#/shared/pagination.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TGachaClaimItem = {
  id: string;
  code: string;
  name: string;
};

export type TGachaClaimUser = {
  id: string;
  name: string;
  email: string;
};

export type TGachaClaimRow = TBaseRow & {
  userId: string;
  source: TGachaClaimSource;
  status: TGachaClaimStatus;
  quantity: number;
  fulfilledAt: Date | null;
  fulfilledBy: string | null;
  item: TGachaClaimItem;
};

export type TGachaClaimAdminRow = TGachaClaimRow & { user: TGachaClaimUser };

export type TGachaClaimRepo = {
  listMine: (
    userId: string,
    input: TGachaClaimMineInput
  ) => Effect.Effect<TRowPage<TGachaClaimRow>, EDatabase>;
  list: (
    input: TGachaClaimListInput
  ) => Effect.Effect<TRowPage<TGachaClaimAdminRow>, EDatabase>;
  findById: (
    id: string
  ) => Effect.Effect<TGachaClaimAdminRow | null, EDatabase>;
  fulfil: (id: string, actorId: string) => Effect.Effect<boolean, EDatabase>;
};

export type TGachaClaimRepoId = TServiceId<typeof REPO_TAG.GACHA_CLAIM>;

export const GachaClaimRepo = Context.Service<
  TGachaClaimRepoId,
  TGachaClaimRepo
>(REPO_TAG.GACHA_CLAIM);
