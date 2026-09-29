import { describe, expect, it } from 'vitest';
import {
  isLegacyHash,
  legacyPasswordVerify,
} from '#/auth/infrastructure/legacy-password.ts';

const PASSWORD = 'password';
const LEGACY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHRzYWx0c2FsdA$T95q7S205tf9WI4HhYOZDIQmMMAbntacGXTIku0gXT8';
const DEFAULT_HASH = 'a1b2c3:d4e5f6';
const MALFORMED_HASH = '$argon2id$v=19$m=19456$broken';

describe('legacy Argon2id passwords', () => {
  it('recognises only the Rust Argon2id PHC format as legacy', (): void => {
    expect(isLegacyHash(LEGACY_HASH)).toBe(true);
    expect(isLegacyHash(DEFAULT_HASH)).toBe(false);
  });

  it('verifies the right password against a hash made by another Argon2 implementation', async (): Promise<void> => {
    expect(await legacyPasswordVerify(LEGACY_HASH, PASSWORD)).toBe(true);
  });

  it('rejects a wrong password', async (): Promise<void> => {
    expect(await legacyPasswordVerify(LEGACY_HASH, 'passw0rd')).toBe(false);
  });

  it('rejects a malformed hash instead of throwing', async (): Promise<void> => {
    expect(await legacyPasswordVerify(MALFORMED_HASH, PASSWORD)).toBe(false);
  });
});
