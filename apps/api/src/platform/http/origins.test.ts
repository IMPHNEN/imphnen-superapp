import { describe, expect, it } from 'vitest';
import { originMatcherOf, originsOf } from '#/platform/http/origins.ts';

const WEB_ORIGIN = 'https://app.example.test';
const WILDCARD = 'https://*.example.test';

const allowed = originMatcherOf([WEB_ORIGIN, WILDCARD]);

describe('originsOf', () => {
  it('keeps the web origin first and drops duplicates', (): void => {
    expect(originsOf(WEB_ORIGIN, [WILDCARD, WEB_ORIGIN])).toEqual([
      WEB_ORIGIN,
      WILDCARD,
    ]);
  });
});

describe('originMatcherOf', () => {
  it('accepts an exact origin', (): void => {
    expect(allowed(WEB_ORIGIN)).toBe(true);
  });

  it('accepts a subdomain through a wildcard', (): void => {
    expect(allowed('https://reports.example.test')).toBe(true);
  });

  it.each([
    [
      'an origin that only contains the pattern',
      'https://app.example.test.attacker.test',
    ],
    ['a lookalike registrable domain', 'https://evil-example.test'],
    ['the parent domain without a subdomain', 'https://example.test'],
    ['the same host over another scheme', 'http://reports.example.test'],
    ['a wildcard reaching across a path', 'https://x/y.example.test'],
    ['an empty origin', ''],
  ])('rejects %s', (_label, origin): void => {
    expect(allowed(origin)).toBe(false);
  });

  it('matches nothing when no pattern is given', (): void => {
    expect(originMatcherOf([])(WEB_ORIGIN)).toBe(false);
  });
});
