import { A } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import type { TGachaRollCandidate } from '#/gacha/domain/gacha-roll.ts';

const HIGH_BITS_SHIFT = 5;
const LOW_BITS_SHIFT = 6;
const LOW_BITS_SPAN = 2 ** 26;
const UNIT_SPAN = 2 ** 53;
const RANDOM_WORDS = 2;

type TPickState = {
  cumulative: number;
  picked: TGachaRollCandidate | undefined;
};

export const secureUnitRandom = (): number => {
  const [high = 0, low = 0] = crypto.getRandomValues(
    new Uint32Array(RANDOM_WORDS)
  );
  return (
    ((high >>> HIGH_BITS_SHIFT) * LOW_BITS_SPAN + (low >>> LOW_BITS_SHIFT)) /
    UNIT_SPAN
  );
};

const pickStep =
  (target: number) =>
  (state: TPickState, candidate: TGachaRollCandidate): TPickState => {
    const cumulative = state.cumulative + candidate.weight;
    return match(state.picked)
      .with(P.nonNullable, (): TPickState => state)
      .otherwise(
        (): TPickState => ({
          cumulative,
          picked: target < cumulative ? candidate : undefined,
        })
      );
  };

export const gachaPick = (
  candidates: readonly TGachaRollCandidate[],
  unit: number
): TGachaRollCandidate | undefined => {
  const eligible = A.filter(
    candidates,
    (candidate): boolean =>
      Number.isFinite(candidate.weight) && candidate.weight > 0
  );
  const total = A.reduce(
    eligible,
    0,
    (sum: number, candidate): number => sum + candidate.weight
  );
  const state = A.reduce(
    eligible,
    { cumulative: 0, picked: undefined } as TPickState,
    pickStep(unit * total)
  );
  return state.picked ?? A.last(eligible) ?? undefined;
};
