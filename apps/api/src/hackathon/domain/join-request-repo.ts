import { Context, type Effect } from 'effect';
import type { EConflict, EDatabase } from '#/shared/errors.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';
import type { TJoinRequestRow } from '#/hackathon/domain/hackathon-rows.ts';
import type { TJoinOutcome } from '#/hackathon/domain/join-outcome.ts';

export type TJoinRequestDraft = {
  teamId: string;
  userId: string;
  message: string;
};

export type TJoinRequestRepo = {
  create: (
    draft: TJoinRequestDraft
  ) => Effect.Effect<TJoinRequestRow, EDatabase | EConflict>;
  find: (id: string) => Effect.Effect<TJoinRequestRow | null, EDatabase>;
  listByUser: (
    userId: string
  ) => Effect.Effect<readonly TJoinRequestRow[], EDatabase>;
  listPendingByTeam: (
    teamId: string
  ) => Effect.Effect<readonly TJoinRequestRow[], EDatabase>;
  accept: (
    request: TJoinRequestRow
  ) => Effect.Effect<TJoinOutcome, EDatabase | EConflict>;
  reject: (id: string) => Effect.Effect<boolean, EDatabase>;
};

export type TJoinRequestRepoId = TServiceId<
  typeof REPO_TAG.HACKATHON_JOIN_REQUEST
>;

export const JoinRequestRepo = Context.Service<
  TJoinRequestRepoId,
  TJoinRequestRepo
>(REPO_TAG.HACKATHON_JOIN_REQUEST);
