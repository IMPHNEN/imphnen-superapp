import type { TUserActiveInput } from '@app/schemas';
import { and, eq, inArray, isNull, type SQL } from 'drizzle-orm';
import type { TUserRow } from '#/user/domain/user.ts';
import type { TDb } from '#/platform/db/client.ts';
import { session, user } from '#/platform/db/tables/auth.ts';

export const liveWhere: SQL = isNull(user.deletedAt);

const inactiveUserIds = (db: TDb, id: string) =>
  db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.id, id), eq(user.isActive, false)));

export const userActiveWrite = async (
  db: TDb,
  input: TUserActiveInput
): Promise<TUserRow | null> => {
  const [rows] = await db.batch([
    db
      .update(user)
      .set({ isActive: input.isActive, updatedAt: new Date() })
      .where(and(eq(user.id, input.id), liveWhere))
      .returning(),
    db
      .delete(session)
      .where(inArray(session.userId, inactiveUserIds(db, input.id))),
  ]);
  return rows[0] ?? null;
};

export const userSoftDelete = async (db: TDb, id: string): Promise<boolean> => {
  const now = new Date();
  const [rows] = await db.batch([
    db
      .update(user)
      .set({ deletedAt: now, isActive: false, updatedAt: now })
      .where(and(eq(user.id, id), liveWhere))
      .returning({ id: user.id }),
    db.delete(session).where(inArray(session.userId, inactiveUserIds(db, id))),
  ]);
  return rows.length > 0;
};
