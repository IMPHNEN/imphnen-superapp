import { describe, expect, it } from 'vitest';
import { SEARCH_MAX_LENGTH, searchQuerySchema } from './search.ts';

describe('searchQuerySchema', () => {
  it('accepts a query up to the maximum length', () => {
    expect(
      searchQuerySchema.safeParse('a'.repeat(SEARCH_MAX_LENGTH))
    ).toMatchObject({ success: true });
  });

  it('rejects a query past the maximum length', () => {
    expect(
      searchQuerySchema.safeParse('a'.repeat(SEARCH_MAX_LENGTH + 1))
    ).toMatchObject({ success: false });
  });
});
