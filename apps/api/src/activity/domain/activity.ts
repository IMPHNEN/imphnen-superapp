import type { TActivityMetadata } from '@app/activity';
import type { TActivityListInput } from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { TBaseEventRow } from '#/shared/base-row.ts';
import type { EDatabase } from '#/shared/errors.ts';
import type { TRowPage } from '#/shared/pagination.ts';
import type { TServiceId } from '#/shared/service-id.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';

export type TActivityRow = TBaseEventRow & {
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: TActivityMetadata | null;
};

export type TActivityReader = {
  list: (
    input: TActivityListInput
  ) => Effect.Effect<TRowPage<TActivityRow>, EDatabase>;
};

export type TActivityPruner = {
  deleteOlderThan: (
    cutoff: Date,
    batchSize: number
  ) => Effect.Effect<number, EDatabase>;
};

export type TActivityPrunerId = TServiceId<typeof REPO_TAG.ACTIVITY_PRUNER>;

export const ActivityPruner = Context.Service<
  TActivityPrunerId,
  TActivityPruner
>(REPO_TAG.ACTIVITY_PRUNER);

export type TActivityRepoId = TServiceId<typeof REPO_TAG.ACTIVITY>;

export const ActivityRepo = Context.Service<TActivityRepoId, TActivityReader>(
  REPO_TAG.ACTIVITY
);
