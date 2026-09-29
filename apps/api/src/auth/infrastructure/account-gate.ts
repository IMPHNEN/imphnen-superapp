import { AUTH_MESSAGE } from '@app/messages';
import { APIError } from 'better-auth/api';
import { eq } from 'drizzle-orm';
import { match } from 'ts-pattern';
import {
  accountUsable,
  type TAccountState,
} from '#/auth/domain/account-state.ts';
import type { TDb } from '#/platform/db/client.ts';
import { user } from '#/platform/db/tables/auth.ts';

type TSessionDraft = { readonly userId: string };

export type TSessionCreateGate = (session: TSessionDraft) => Promise<void>;

const API_STATUS_FORBIDDEN = 'FORBIDDEN';

export const accountStateRead = async (
  db: TDb,
  userId: string
): Promise<TAccountState | null> => {
  const [row] = await db
    .select({ isActive: user.isActive, deletedAt: user.deletedAt })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row ?? null;
};

export const sessionCreateGateOf =
  (db: TDb): TSessionCreateGate =>
  async (session): Promise<void> =>
    match(accountUsable(await accountStateRead(db, session.userId)))
      .with(true, (): void => undefined)
      .with(false, (): never => {
        throw new APIError(API_STATUS_FORBIDDEN, {
          message: AUTH_MESSAGE.ACCOUNT_INACTIVE,
        });
      })
      .exhaustive();
