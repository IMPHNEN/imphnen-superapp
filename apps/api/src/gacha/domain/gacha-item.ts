import type {
  TGachaItemCreateInput,
  TGachaItemListInput,
  TGachaItemUpdateInput,
  TGachaMetadata,
} from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { TBaseRow } from '#/shared/base-row.ts';
import type { EConflict, EDatabase } from '#/shared/errors.ts';
import type { TRowPage } from '#/shared/pagination.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TGachaItemRow = TBaseRow & {
  code: string;
  name: string;
  description: string;
  rarity: string;
  type: string;
  category: string;
  value: number;
  weight: number;
  stock: number;
  isLimited: boolean;
  metadata: TGachaMetadata;
  deletedAt: Date | null;
};

export type TGachaItemRepo = {
  list: (
    input: TGachaItemListInput
  ) => Effect.Effect<TRowPage<TGachaItemRow>, EDatabase>;
  findById: (id: string) => Effect.Effect<TGachaItemRow | null, EDatabase>;
  create: (
    input: TGachaItemCreateInput
  ) => Effect.Effect<TGachaItemRow, EConflict | EDatabase>;
  update: (
    input: TGachaItemUpdateInput
  ) => Effect.Effect<TGachaItemRow | null, EConflict | EDatabase>;
  softDelete: (id: string) => Effect.Effect<TGachaItemRow | null, EDatabase>;
};

export type TGachaItemRepoId = TServiceId<typeof REPO_TAG.GACHA_ITEM>;

export const GachaItemRepo = Context.Service<TGachaItemRepoId, TGachaItemRepo>(
  REPO_TAG.GACHA_ITEM
);
