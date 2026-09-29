import { describe, expect, it } from 'vitest';
import { accountUsable } from '#/auth/domain/account-state.ts';

describe('accountUsable', () => {
  it('lets an active, undeleted account sign in', (): void => {
    expect(accountUsable({ isActive: true, deletedAt: null })).toBe(true);
  });

  it('blocks a deactivated account', (): void => {
    expect(accountUsable({ isActive: false, deletedAt: null })).toBe(false);
  });

  it('blocks a soft-deleted account even when still flagged active', (): void => {
    expect(accountUsable({ isActive: true, deletedAt: new Date() })).toBe(
      false
    );
  });

  it('blocks an account that no longer exists', (): void => {
    expect(accountUsable(null)).toBe(false);
  });
});
