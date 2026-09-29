import { describe, expect, it } from 'vitest';
import { activityMetadataSchema } from './activity.ts';

describe('activityMetadataSchema', () => {
  it('accepts a flat map of primitive details', () => {
    expect(
      activityMetadataSchema.safeParse({
        role: 'member',
        count: 2,
        revoked: true,
        previous: null,
      })
    ).toMatchObject({ success: true });
  });

  it('rejects nested structures, which the log could not render or filter', () => {
    expect(
      activityMetadataSchema.safeParse({ changes: { role: 'member' } })
    ).toMatchObject({ success: false });
    expect(activityMetadataSchema.safeParse({ tags: ['a'] })).toMatchObject({
      success: false,
    });
  });
});
