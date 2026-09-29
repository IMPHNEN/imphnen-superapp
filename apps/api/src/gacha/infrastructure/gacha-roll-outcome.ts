import { GACHA_CLAIM_SOURCE, GACHA_CLAIM_STATUS } from '@app/schemas';
import { match, P } from 'ts-pattern';
import type { TGachaClaimItem } from '#/gacha/domain/gacha-claim.ts';
import {
  GACHA_ROLL_OUTCOME,
  type TGachaRollOutcome,
} from '#/gacha/domain/gacha-roll.ts';
import { GACHA_RULE } from '#/gacha/domain/gacha-rules.ts';

export type TGachaRollBatchResult = {
  claimId: string;
  userId: string;
  now: Date;
  cost: number;
  recorded: boolean;
  balance: number;
  item: TGachaClaimItem | undefined;
};

export const rollOutcomeOf = (
  result: TGachaRollBatchResult
): TGachaRollOutcome =>
  match(result)
    .with(
      { recorded: true, item: P.nonNullable },
      (won): TGachaRollOutcome => ({
        kind: GACHA_ROLL_OUTCOME.WON,
        balance: won.balance,
        claim: {
          id: won.claimId,
          userId: won.userId,
          source: GACHA_CLAIM_SOURCE.ROLL,
          status: GACHA_CLAIM_STATUS.PENDING,
          quantity: GACHA_RULE.CLAIM_QUANTITY,
          fulfilledAt: null,
          fulfilledBy: null,
          createdAt: won.now,
          updatedAt: won.now,
          item: won.item,
        },
      })
    )
    .when(
      (lost): boolean => lost.balance < lost.cost,
      (): TGachaRollOutcome => ({
        kind: GACHA_ROLL_OUTCOME.INSUFFICIENT_CREDITS,
      })
    )
    .otherwise(
      (): TGachaRollOutcome => ({ kind: GACHA_ROLL_OUTCOME.OUT_OF_STOCK })
    );
