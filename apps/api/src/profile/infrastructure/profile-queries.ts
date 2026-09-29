import type { TProfileUpdateInput } from '@app/schemas';
import { D } from '@mobily/ts-belt';
import { and, eq, isNull } from 'drizzle-orm';
import { match, P } from 'ts-pattern';
import type { TAvatar, TProfileRow } from '#/profile/domain/profile.ts';
import type { TDb } from '#/platform/db/client.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { userProfile } from '#/platform/db/tables/profile.ts';

const liveUserWhere = (userId: string) =>
  and(eq(user.id, userId), isNull(user.deletedAt));

const PROFILE_META_FIELDS = ['userId', 'createdAt', 'updatedAt'] as const;

export const profileRead = async (
  db: TDb,
  userId: string
): Promise<TProfileRow | null> => {
  const [row] = await db
    .select({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      extension: userProfile,
    })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .where(liveUserWhere(userId))
    .limit(1);
  return match(row)
    .with(P.nullish, (): null => null)
    .otherwise(
      (found): TProfileRow => ({
        user: found.user,
        extension: match(found.extension)
          .with(P.nullish, (): null => null)
          .otherwise((extension) =>
            D.deleteKeys(extension, PROFILE_META_FIELDS)
          ),
      })
    );
};

export const profileWrite = async (
  db: TDb,
  userId: string,
  input: TProfileUpdateInput
): Promise<void> => {
  const now = new Date();
  const extension = input.extension ?? {};
  const nameSet = input.name === undefined ? {} : { name: input.name };
  await db.batch([
    db
      .update(user)
      .set(D.merge(nameSet, { updatedAt: now }))
      .where(liveUserWhere(userId)),
    db
      .insert(userProfile)
      .values(D.merge(extension, { userId }))
      .onConflictDoUpdate({
        target: userProfile.userId,
        set: D.merge(extension, { updatedAt: now }),
      }),
  ]);
};

export const avatarWrite = async (
  db: TDb,
  userId: string,
  avatar: TAvatar
): Promise<string | null> => {
  const now = new Date();
  const [current] = await db
    .select({ avatarKey: userProfile.avatarKey })
    .from(userProfile)
    .where(eq(userProfile.userId, userId))
    .limit(1);
  await db.batch([
    db
      .insert(userProfile)
      .values({ userId, avatarKey: avatar.key })
      .onConflictDoUpdate({
        target: userProfile.userId,
        set: { avatarKey: avatar.key, updatedAt: now },
      }),
    db
      .update(user)
      .set({ image: avatar.url, updatedAt: now })
      .where(liveUserWhere(userId)),
  ]);
  return current?.avatarKey ?? null;
};
