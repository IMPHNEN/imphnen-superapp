import { Context, type Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';
import type {
  TMembershipRow,
  TTeamState,
} from '#/hackathon/domain/hackathon-rows.ts';

export type TMembershipRepo = {
  findByUser: (
    userId: string
  ) => Effect.Effect<TMembershipRow | null, EDatabase>;
  findByEmail: (
    email: string
  ) => Effect.Effect<TMembershipRow | null, EDatabase>;
  teamState: (teamId: string) => Effect.Effect<TTeamState, EDatabase>;
  removeMember: (
    teamId: string,
    userId: string
  ) => Effect.Effect<boolean, EDatabase>;
};

export type TMembershipRepoId = TServiceId<
  typeof REPO_TAG.HACKATHON_MEMBERSHIP
>;

export const MembershipRepo = Context.Service<
  TMembershipRepoId,
  TMembershipRepo
>(REPO_TAG.HACKATHON_MEMBERSHIP);
