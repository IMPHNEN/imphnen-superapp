import type { THackathonCertificate } from '@app/schemas';
import { Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  CertificateRepo,
  type TCertificateRepoId,
} from '#/hackathon/domain/award-repo.ts';
import { toCertificateDto } from '#/hackathon/application/to-award-dto.ts';

export const certificateMine = Effect.fn('certificateMine')(function* (
  userId: string
): Effect.fn.Return<
  THackathonCertificate | null,
  EDatabase,
  TCertificateRepoId | TStorageServiceId
> {
  const certificateRepo = yield* CertificateRepo;
  const { publicUrlOf } = yield* StorageService;
  const row = yield* certificateRepo.findByUser(userId);

  return row === null ? null : toCertificateDto(row, publicUrlOf);
});
