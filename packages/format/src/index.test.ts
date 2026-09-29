import { describe, expect, it } from 'vitest';
import { formatUsd, orDash } from './index.ts';

describe('orDash', () => {
  it('returns the em dash for empty values', (): void => {
    expect(orDash(null)).toBe('-');
    expect(orDash(undefined)).toBe('-');
    expect(orDash('')).toBe('-');
  });

  it('stringifies present values', (): void => {
    expect(orDash(42)).toBe('42');
  });
});

describe('formatUsd', () => {
  it('formats cents as dollars', (): void => {
    expect(formatUsd(1050)).toBe('$10.50');
  });
});
