import type {
  THackathonTeamBrowse,
  THackathonTeamBrowseInput,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import { TeamRepo, type TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import { toTeamSummaryDto } from '#/hackathon/application/to-team-dto.ts';

export const teamBrowse = Effect.fn('teamBrowse')(function* (
  input: THackathonTeamBrowseInput
): Effect.fn.Return<
  THackathonTeamBrowse,
  EDatabase,
  TTeamRepoId | TStorageServiceId
> {
  const teamRepo = yield* TeamRepo;
  const { publicUrlOf } = yield* StorageService;
  const { items, total } = yield* teamRepo.browse(input);

  return {
    items: A.map(items, (row) => toTeamSummaryDto(row, publicUrlOf)),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});
