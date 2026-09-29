import { HACKATHON_MESSAGE } from '@app/messages';
import type { THackathonCertificate, THackathonIdInput } from '@app/schemas';
import { Effect } from 'effect';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  CertificateRepo,
  type TCertificateRepoId,
} from '#/hackathon/domain/award-repo.ts';
import { toCertificateDto } from '#/hackathon/application/to-award-dto.ts';

export const certificateGet = Effect.fn('certificateGet')(function* ({
  id,
}: THackathonIdInput): Effect.fn.Return<
  THackathonCertificate,
  ENotFound | EDatabase,
  TCertificateRepoId | TStorageServiceId
> {
  const certificateRepo = yield* CertificateRepo;
  const { publicUrlOf } = yield* StorageService;
  const row = yield* certificateRepo.find(id);

  if (row === null) {
    return yield* new ENotFound({
      message: HACKATHON_MESSAGE.CERTIFICATE_NOT_FOUND,
    });
  }

  return toCertificateDto(row, publicUrlOf);
});
