import { GACHA_MESSAGE } from '@app/messages';
import type { TGachaRollResult } from '@app/schemas';
import { Effect } from 'effect';
import { toGachaClaimDto } from '#/gacha/application/claim/to-gacha-claim-dto.ts';
import { gachaPick, secureUnitRandom } from '#/gacha/domain/gacha-pick.ts';
import {
  GACHA_ROLL_OUTCOME,
  GachaRollRepo,
  type TGachaRollRepoId,
} from '#/gacha/domain/gacha-roll.ts';
import { GACHA_RULE } from '#/gacha/domain/gacha-rules.ts';
import { EBadRequest, EConflict, type EDatabase } from '#/shared/errors.ts';

const FIRST_ATTEMPT = 1;

type TGachaRollError = EBadRequest | EConflict | EDatabase;

const gachaRollAttempt = (
  userId: string,
  attempt: number
): Effect.Effect<TGachaRollResult, TGachaRollError, TGachaRollRepoId> =>
  Effect.gen(function* () {
    const repo = yield* GachaRollRepo;
    const picked = gachaPick(yield* repo.candidates(), secureUnitRandom());

    if (picked === undefined) {
      return yield* new EConflict({ message: GACHA_MESSAGE.ROLL_NO_PRIZE });
    }

    const outcome = yield* repo.commit(userId, picked.id, GACHA_RULE.ROLL_COST);

    if (outcome.kind === GACHA_ROLL_OUTCOME.INSUFFICIENT_CREDITS) {
      return yield* new EBadRequest({
        message: GACHA_MESSAGE.CREDIT_INSUFFICIENT,
      });
    }

    if (outcome.kind === GACHA_ROLL_OUTCOME.OUT_OF_STOCK) {
      if (attempt >= GACHA_RULE.ROLL_MAX_ATTEMPTS) {
        return yield* new EConflict({ message: GACHA_MESSAGE.ROLL_SOLD_OUT });
      }
      return yield* gachaRollAttempt(userId, attempt + 1);
    }

    return { claim: toGachaClaimDto(outcome.claim), balance: outcome.balance };
  });

export const gachaRoll = Effect.fn('gachaRoll')(function* (
  userId: string
): Effect.fn.Return<TGachaRollResult, TGachaRollError, TGachaRollRepoId> {
  return yield* gachaRollAttempt(userId, FIRST_ATTEMPT);
});
