import { Context, type Effect } from 'effect';
import type { EConflict, EDatabase } from '#/shared/errors.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';
import type { TInvitationRow } from '#/hackathon/domain/hackathon-rows.ts';
import type { TJoinOutcome } from '#/hackathon/domain/join-outcome.ts';

export type TInvitationDraft = {
  teamId: string;
  inviterId: string;
  inviteeEmail: string;
};

export type TInvitationRepo = {
  create: (
    draft: TInvitationDraft
  ) => Effect.Effect<TInvitationRow, EDatabase | EConflict>;
  find: (id: string) => Effect.Effect<TInvitationRow | null, EDatabase>;
  listPending: (
    email: string
  ) => Effect.Effect<readonly TInvitationRow[], EDatabase>;
  accept: (
    invitation: TInvitationRow,
    userId: string
  ) => Effect.Effect<TJoinOutcome, EDatabase | EConflict>;
  reject: (id: string) => Effect.Effect<boolean, EDatabase>;
};

export type TInvitationRepoId = TServiceId<
  typeof REPO_TAG.HACKATHON_INVITATION
>;

export const InvitationRepo = Context.Service<
  TInvitationRepoId,
  TInvitationRepo
>(REPO_TAG.HACKATHON_INVITATION);
