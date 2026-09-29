import type {
  THackathonSubmissionCreateInput,
  THackathonSubmissionStatus,
  THackathonSubmissionUpdateInput,
} from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { EConflict, EDatabase } from '#/shared/errors.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';
import type { TSubmissionRow } from '#/hackathon/domain/hackathon-rows.ts';

export type TSubmissionTransition = {
  id: string;
  from: readonly THackathonSubmissionStatus[];
  to: THackathonSubmissionStatus;
  minMembers: number;
  stampSubmittedAt: boolean;
};

export type TSubmissionRepo = {
  findByTeam: (
    teamId: string
  ) => Effect.Effect<TSubmissionRow | null, EDatabase>;
  find: (id: string) => Effect.Effect<TSubmissionRow | null, EDatabase>;
  create: (
    input: THackathonSubmissionCreateInput,
    createdBy: string,
    minMembers: number
  ) => Effect.Effect<TSubmissionRow | null, EDatabase | EConflict>;
  updateDraft: (
    input: THackathonSubmissionUpdateInput
  ) => Effect.Effect<TSubmissionRow | null, EDatabase>;
  transition: (
    transition: TSubmissionTransition
  ) => Effect.Effect<TSubmissionRow | null, EDatabase>;
};

export type TSubmissionRepoId = TServiceId<
  typeof REPO_TAG.HACKATHON_SUBMISSION
>;

export const SubmissionRepo = Context.Service<
  TSubmissionRepoId,
  TSubmissionRepo
>(REPO_TAG.HACKATHON_SUBMISSION);
