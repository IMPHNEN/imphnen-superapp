import type {
  TRoadmapCreateInput,
  TRoadmapListInput,
  TRoadmapStatus,
} from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { TBaseRow } from '#/shared/base-row.ts';
import type { EDatabase } from '#/shared/errors.ts';
import type { TRowPage } from '#/shared/pagination.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TRoadmapItemRow = TBaseRow & {
  title: string;
  description: string;
  status: TRoadmapStatus;
  votes: number;
  votedByMe: boolean;
};

export type TRoadmapItemRepo = {
  list: (
    input: TRoadmapListInput,
    viewerId: string | null
  ) => Effect.Effect<TRowPage<TRoadmapItemRow>, EDatabase>;
  findById: (
    id: string,
    viewerId: string | null
  ) => Effect.Effect<TRoadmapItemRow | null, EDatabase>;
  create: (input: TRoadmapCreateInput) => Effect.Effect<string, EDatabase>;
  update: (
    id: string,
    input: TRoadmapCreateInput
  ) => Effect.Effect<boolean, EDatabase>;
  softDelete: (id: string) => Effect.Effect<boolean, EDatabase>;
  voteCast: (itemId: string, userId: string) => Effect.Effect<void, EDatabase>;
  voteWithdraw: (
    itemId: string,
    userId: string
  ) => Effect.Effect<void, EDatabase>;
};

export type TRoadmapItemRepoId = TServiceId<typeof REPO_TAG.ROADMAP_ITEM>;

export const RoadmapItemRepo = Context.Service<
  TRoadmapItemRepoId,
  TRoadmapItemRepo
>(REPO_TAG.ROADMAP_ITEM);
