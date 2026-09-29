import { Context, type Effect } from 'effect';
import type { TGachaClaimRow } from '#/gacha/domain/gacha-claim.ts';
import type { EDatabase } from '#/shared/errors.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TGachaRollCandidate = {
  id: string;
  weight: number;
};

export const GACHA_ROLL_OUTCOME = {
  WON: 'won',
  INSUFFICIENT_CREDITS: 'insufficient-credits',
  OUT_OF_STOCK: 'out-of-stock',
} as const;

export type TGachaRollOutcome =
  | {
      kind: typeof GACHA_ROLL_OUTCOME.WON;
      claim: TGachaClaimRow;
      balance: number;
    }
  | { kind: typeof GACHA_ROLL_OUTCOME.INSUFFICIENT_CREDITS }
  | { kind: typeof GACHA_ROLL_OUTCOME.OUT_OF_STOCK };

export type TGachaRollRepo = {
  candidates: () => Effect.Effect<readonly TGachaRollCandidate[], EDatabase>;
  commit: (
    userId: string,
    itemId: string,
    cost: number
  ) => Effect.Effect<TGachaRollOutcome, EDatabase>;
};

export type TGachaRollRepoId = TServiceId<typeof REPO_TAG.GACHA_ROLL>;

export const GachaRollRepo = Context.Service<TGachaRollRepoId, TGachaRollRepo>(
  REPO_TAG.GACHA_ROLL
);
