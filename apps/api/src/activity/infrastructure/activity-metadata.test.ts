import { describe, expect, it } from 'vitest';
import { activityMetadataDecode } from '#/activity/infrastructure/activity-metadata.ts';

describe('activityMetadataDecode', () => {
  it('passes a flat map of primitives through', () => {
    expect(activityMetadataDecode({ role: 'member', revoked: true })).toEqual({
      role: 'member',
      revoked: true,
    });
  });

  it('keeps an absent value absent', () => {
    expect(activityMetadataDecode(null)).toBeNull();
  });

  it('drops a stored value that no longer matches the contract instead of failing the list', () => {
    expect(activityMetadataDecode({ changes: { role: 'member' } })).toBeNull();
    expect(activityMetadataDecode('free text')).toBeNull();
  });
});
