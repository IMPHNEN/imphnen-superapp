import type { THackathonSubmission, THackathonTeamIdInput } from '@app/schemas';
import { Effect } from 'effect';
import type { EDatabase, EForbidden } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import type { TMembershipRepoId } from '#/hackathon/domain/membership-repo.ts';
import {
  SubmissionRepo,
  type TSubmissionRepoId,
} from '#/hackathon/domain/submission-repo.ts';
import type { THackathonViewer } from '#/hackathon/domain/viewer.ts';
import { membershipEnsure } from '#/hackathon/application/hackathon-guards.ts';
import { toSubmissionDto } from '#/hackathon/application/to-activity-dto.ts';

export const submissionGet = Effect.fn('submissionGet')(function* (
  { teamId }: THackathonTeamIdInput,
  viewer: THackathonViewer
): Effect.fn.Return<
  THackathonSubmission | null,
  EForbidden | EDatabase,
  TMembershipRepoId | TSubmissionRepoId | TStorageServiceId
> {
  const submissionRepo = yield* SubmissionRepo;
  const { publicUrlOf } = yield* StorageService;

  if (!viewer.canManage) {
    yield* membershipEnsure(teamId, viewer.userId ?? '');
  }

  const row = yield* submissionRepo.findByTeam(teamId);
  return row === null ? null : toSubmissionDto(row, publicUrlOf);
});
