import { and, eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { AUTH_PROVIDER } from '#/auth/domain/auth-provider.ts';
import type { TLegacyUpgrade } from '#/auth/infrastructure/password-verify.ts';
import type { TDb } from '#/platform/db/client.ts';
import { account } from '#/platform/db/tables/auth.ts';

const UPGRADE_FAILED_LOG = 'auth.legacy_password.upgrade_failed';

const upgradeFailedLog = (cause: unknown): void => {
  console.error(
    JSON.stringify({ msg: UPGRADE_FAILED_LOG, cause: String(cause) })
  );
};

const upgradeRun = async (
  db: TDb,
  legacyHash: string,
  password: string
): Promise<void> => {
  const next = await hashPassword(password);
  await db
    .update(account)
    .set({ password: next, updatedAt: new Date() })
    .where(
      and(
        eq(account.providerId, AUTH_PROVIDER.CREDENTIAL),
        eq(account.password, legacyHash)
      )
    );
};

export const legacyPasswordUpgradeOf =
  (db: TDb): TLegacyUpgrade =>
  (legacyHash, password): Promise<void> =>
    upgradeRun(db, legacyHash, password).catch(upgradeFailedLog);
