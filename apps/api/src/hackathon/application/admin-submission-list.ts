import type {
  THackathonSubmissionAdminList,
  THackathonSubmissionAdminListInput,
} from '@app/schemas';
import { hackathonSubmissionAdminItemSchema } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import { AdminRepo, type TAdminRepoId } from '#/hackathon/domain/admin-repo.ts';
import { toSubmissionFields } from '#/hackathon/application/to-activity-dto.ts';
import { toTeamRefDto } from '#/hackathon/application/to-team-dto.ts';

export const adminSubmissionList = Effect.fn('adminSubmissionList')(function* (
  input: THackathonSubmissionAdminListInput
): Effect.fn.Return<
  THackathonSubmissionAdminList,
  EDatabase,
  TAdminRepoId | TStorageServiceId
> {
  const adminRepo = yield* AdminRepo;
  const { publicUrlOf } = yield* StorageService;
  const { items, total } = yield* adminRepo.submissions(input);

  return {
    items: A.map(items, (row) =>
      hackathonSubmissionAdminItemSchema.parse({
        ...toSubmissionFields(row, publicUrlOf),
        team: toTeamRefDto(row.team, publicUrlOf),
      })
    ),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});
