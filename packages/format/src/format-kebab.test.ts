import { describe, expect, it } from 'vitest';
import { kebabCase, kebabCaseDraft } from './format-kebab.ts';

describe('kebabCase', () => {
  it('lowercases words and joins them with single hyphens', (): void => {
    expect(kebabCase('Content Reviewer')).toBe('content-reviewer');
    expect(kebabCase('  QA   Lead / Ops_Team ')).toBe('qa-lead-ops-team');
  });

  it('drops accents rather than the letters under them', (): void => {
    expect(kebabCase('Café Crème')).toBe('cafe-creme');
  });

  it('trims hyphens from both ends', (): void => {
    expect(kebabCase('--Editor--')).toBe('editor');
  });
});

describe('kebabCaseDraft', () => {
  it('keeps a trailing hyphen so the next word can still be typed', (): void => {
    expect(kebabCaseDraft('Content ')).toBe('content-');
  });

  it('still drops leading separators', (): void => {
    expect(kebabCaseDraft(' -Content')).toBe('content');
  });
});
