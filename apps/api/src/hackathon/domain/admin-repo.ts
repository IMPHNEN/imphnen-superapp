import type {
  THackathonAdminListInput,
  THackathonSubmissionAdminListInput,
  THackathonSubmissionStatus,
} from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import type { TRowPage } from '#/shared/pagination.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';
import type {
  TParticipantRow,
  TSubmissionRow,
  TTeamRefRow,
  TTeamSummaryRow,
} from '#/hackathon/domain/hackathon-rows.ts';

export type TAdminParticipantRow = TParticipantRow & {
  role: string;
  team: TTeamRefRow | null;
  createdAt: Date;
};

export type TAdminTeamRow = TTeamSummaryRow & {
  submissionStatus: THackathonSubmissionStatus | null;
};

export type TAdminSubmissionRow = TSubmissionRow & { team: TTeamRefRow };

export type TAdminRepo = {
  participants: (
    input: THackathonAdminListInput
  ) => Effect.Effect<TRowPage<TAdminParticipantRow>, EDatabase>;
  teams: (
    input: THackathonAdminListInput
  ) => Effect.Effect<TRowPage<TAdminTeamRow>, EDatabase>;
  submissions: (
    input: THackathonSubmissionAdminListInput
  ) => Effect.Effect<TRowPage<TAdminSubmissionRow>, EDatabase>;
};

export type TAdminRepoId = TServiceId<typeof REPO_TAG.HACKATHON_ADMIN>;

export const AdminRepo = Context.Service<TAdminRepoId, TAdminRepo>(
  REPO_TAG.HACKATHON_ADMIN
);
