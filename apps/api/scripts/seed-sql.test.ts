import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { describe, expect, it } from 'vitest';
import { SEED_USERS } from './seed-data.ts';
import { seedSqlBuild, sqlText } from './seed-sql.ts';

const NOW = 1_800_000_000_000;

describe('seed SQL', () => {
  it('escapes single quotes in text values', (): void => {
    expect(sqlText("O'Brien")).toBe("'O''Brien'");
  });

  it('writes a user, a credential account and a profile per seed user', (): void => {
    const statements = seedSqlBuild(SEED_USERS, 'salt:key', NOW).split('\n');

    expect(statements).toHaveLength(SEED_USERS.length * 3);
    expect(statements[0]).toContain(sqlText(SEED_USERS[0]?.email ?? ''));
  });

  it('stores a hash that better-auth verifies', async (): Promise<void> => {
    const hash = await hashPassword('password123');

    expect(await verifyPassword({ hash, password: 'password123' })).toBe(true);
  });
});
