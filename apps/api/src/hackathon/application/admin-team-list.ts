import type {
  THackathonAdminListInput,
  THackathonAdminTeamList,
} from '@app/schemas';
import { hackathonAdminTeamSchema } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import { AdminRepo, type TAdminRepoId } from '#/hackathon/domain/admin-repo.ts';
import { toTeamSummaryDto } from '#/hackathon/application/to-team-dto.ts';

export const adminTeamList = Effect.fn('adminTeamList')(function* (
  input: THackathonAdminListInput
): Effect.fn.Return<
  THackathonAdminTeamList,
  EDatabase,
  TAdminRepoId | TStorageServiceId
> {
  const adminRepo = yield* AdminRepo;
  const { publicUrlOf } = yield* StorageService;
  const { items, total } = yield* adminRepo.teams(input);

  return {
    items: A.map(items, (row) =>
      hackathonAdminTeamSchema.parse({
        ...toTeamSummaryDto(row, publicUrlOf),
        submissionStatus: row.submissionStatus,
      })
    ),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});
