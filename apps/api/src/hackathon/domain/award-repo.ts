import type { THackathonWinnerSetInput } from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';
import type {
  TCertificateRow,
  TWinnerRow,
} from '#/hackathon/domain/hackathon-rows.ts';

export type TWinnerRepo = {
  list: () => Effect.Effect<readonly TWinnerRow[], EDatabase>;
  upsert: (
    input: THackathonWinnerSetInput
  ) => Effect.Effect<TWinnerRow | null, EDatabase>;
  remove: (teamId: string) => Effect.Effect<boolean, EDatabase>;
};

export type TWinnerRepoId = TServiceId<typeof REPO_TAG.HACKATHON_WINNER>;

export const WinnerRepo = Context.Service<TWinnerRepoId, TWinnerRepo>(
  REPO_TAG.HACKATHON_WINNER
);

export type TCertificateRepo = {
  find: (id: string) => Effect.Effect<TCertificateRow | null, EDatabase>;
  findByUser: (
    userId: string
  ) => Effect.Effect<TCertificateRow | null, EDatabase>;
};

export type TCertificateRepoId = TServiceId<
  typeof REPO_TAG.HACKATHON_CERTIFICATE
>;

export const CertificateRepo = Context.Service<
  TCertificateRepoId,
  TCertificateRepo
>(REPO_TAG.HACKATHON_CERTIFICATE);
