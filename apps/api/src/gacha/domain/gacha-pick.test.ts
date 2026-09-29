import { A } from '@mobily/ts-belt';
import { describe, expect, it } from 'vitest';
import { gachaPick, secureUnitRandom } from '#/gacha/domain/gacha-pick.ts';
import type { TGachaRollCandidate } from '#/gacha/domain/gacha-roll.ts';

const COMMON: TGachaRollCandidate = { id: 'common', weight: 3 };
const RARE: TGachaRollCandidate = { id: 'rare', weight: 1 };
const DISABLED: TGachaRollCandidate = { id: 'disabled', weight: 0 };
const SAMPLES = 20_000;
const TOLERANCE = 0.02;

describe('gachaPick', () => {
  it('maps the unit interval onto the cumulative weights', (): void => {
    const pool = [COMMON, RARE];

    expect(gachaPick(pool, 0)).toBe(COMMON);
    expect(gachaPick(pool, 0.7499)).toBe(COMMON);
    expect(gachaPick(pool, 0.75)).toBe(RARE);
    expect(gachaPick(pool, 0.9999)).toBe(RARE);
  });

  it('never picks an item whose weight is zero', (): void => {
    const pool = [DISABLED, RARE];

    expect(gachaPick(pool, 0)).toBe(RARE);
    expect(gachaPick(pool, 0.9999)).toBe(RARE);
  });

  it('returns nothing when no item can be won', (): void => {
    expect(gachaPick([], 0.5)).toBeUndefined();
    expect(gachaPick([DISABLED], 0.5)).toBeUndefined();
  });

  it('draws in proportion to the weights with the secure source', (): void => {
    const picks = A.makeWithIndex(SAMPLES, () =>
      gachaPick([COMMON, RARE], secureUnitRandom())
    );
    const rareShare =
      A.length(A.filter(picks, (picked) => picked === RARE)) / SAMPLES;

    expect(Math.abs(rareShare - 0.25)).toBeLessThan(TOLERANCE);
  });
});

describe('secureUnitRandom', () => {
  it('stays inside the unit interval', (): void => {
    const draws = A.makeWithIndex(1000, () => secureUnitRandom());

    expect(A.every(draws, (draw) => draw >= 0 && draw < 1)).toBe(true);
  });
});
