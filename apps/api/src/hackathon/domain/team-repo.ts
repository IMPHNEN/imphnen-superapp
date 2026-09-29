import type {
  THackathonTeamBrowseInput,
  THackathonTeamCreateInput,
  THackathonTeamUpdateInput,
} from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { EConflict, EDatabase } from '#/shared/errors.ts';
import type { TRowPage } from '#/shared/pagination.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';
import type {
  TTeamDetailRow,
  TTeamRow,
  TTeamSummaryRow,
} from '#/hackathon/domain/hackathon-rows.ts';

export type TTeamLeader = {
  id: string;
  email: string;
};

export type TTeamRepo = {
  browse: (
    input: THackathonTeamBrowseInput
  ) => Effect.Effect<TRowPage<TTeamSummaryRow>, EDatabase>;
  find: (id: string) => Effect.Effect<TTeamRow | null, EDatabase>;
  findDetail: (id: string) => Effect.Effect<TTeamDetailRow | null, EDatabase>;
  create: (
    input: THackathonTeamCreateInput,
    leader: TTeamLeader
  ) => Effect.Effect<string, EDatabase | EConflict>;
  update: (input: THackathonTeamUpdateInput) => Effect.Effect<void, EDatabase>;
  removeIfAlone: (id: string) => Effect.Effect<boolean, EDatabase>;
  remove: (id: string) => Effect.Effect<boolean, EDatabase>;
};

export type TTeamRepoId = TServiceId<typeof REPO_TAG.HACKATHON_TEAM>;

export const TeamRepo = Context.Service<TTeamRepoId, TTeamRepo>(
  REPO_TAG.HACKATHON_TEAM
);
