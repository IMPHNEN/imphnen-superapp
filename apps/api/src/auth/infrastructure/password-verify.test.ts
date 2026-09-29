import { hashPassword } from 'better-auth/crypto';
import { describe, expect, it, vi } from 'vitest';
import { passwordVerifyOf } from '#/auth/infrastructure/password-verify.ts';

const PASSWORD = 'password';
const LEGACY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHRzYWx0c2FsdA$T95q7S205tf9WI4HhYOZDIQmMMAbntacGXTIku0gXT8';

describe('passwordVerifyOf', () => {
  it('upgrades a legacy hash after a successful verify', async (): Promise<void> => {
    const upgrade = vi.fn(async (): Promise<void> => undefined);

    const valid = await passwordVerifyOf(upgrade)({
      hash: LEGACY_HASH,
      password: PASSWORD,
    });

    expect(valid).toBe(true);
    expect(upgrade).toHaveBeenCalledWith(LEGACY_HASH, PASSWORD);
  });

  it('never upgrades on a failed legacy verify', async (): Promise<void> => {
    const upgrade = vi.fn(async (): Promise<void> => undefined);

    const valid = await passwordVerifyOf(upgrade)({
      hash: LEGACY_HASH,
      password: 'wrong-password',
    });

    expect(valid).toBe(false);
    expect(upgrade).not.toHaveBeenCalled();
  });

  it('falls back to the default verifier for new hashes', async (): Promise<void> => {
    const upgrade = vi.fn(async (): Promise<void> => undefined);
    const hash = await hashPassword(PASSWORD);

    const verify = passwordVerifyOf(upgrade);

    expect(await verify({ hash, password: PASSWORD })).toBe(true);
    expect(await verify({ hash, password: 'wrong-password' })).toBe(false);
    expect(upgrade).not.toHaveBeenCalled();
  });
});
