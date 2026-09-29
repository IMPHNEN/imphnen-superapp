import { USER_MESSAGE } from '@app/messages';
import { D } from '@mobily/ts-belt';
import { and, count, eq } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { EAuth, EConflict, EDatabase } from '#/shared/errors.ts';
import { offsetFor, orderFor } from '#/shared/pagination.ts';
import { UserRepo, type TUserRepo, type TUserRow } from '#/user/domain/user.ts';
import { AUTH_PROVIDER, AuthService } from '#/auth/index.ts';
import { DbService } from '#/platform/db/db-service.ts';
import {
  activeWhere,
  roleWhere,
  SORT_COLUMN,
  searchWhere,
} from '#/user/infrastructure/user-filters.ts';
import {
  liveWhere,
  userActiveWrite,
  userSoftDelete,
} from '#/user/infrastructure/user-lifecycle.ts';
import { isUniqueViolation } from '#/platform/db/unique-violation.ts';
import { session, user } from '#/platform/db/tables/auth.ts';

const USER_PROVISIONING_METHOD = 'admin';

export const userRepoLayer = Layer.effect(
  UserRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;
    const { auth } = yield* AuthService;

    const list: TUserRepo['list'] = ({
      page,
      pageSize,
      search,
      role,
      isActive,
      sortBy,
      sortDir,
    }) => {
      const where = and(
        liveWhere,
        searchWhere(search),
        roleWhere(role),
        activeWhere(isActive)
      );

      return Effect.tryPromise({
        try: async () => {
          const [items, [{ value: total }]] = await Promise.all([
            db
              .select()
              .from(user)
              .where(where)
              .limit(pageSize)
              .offset(offsetFor({ page, pageSize }))
              .orderBy(orderFor(SORT_COLUMN[sortBy], sortDir)),
            db.select({ value: count() }).from(user).where(where),
          ]);
          return { items, total };
        },
        catch: (cause) => new EDatabase({ cause }),
      });
    };

    const findById: TUserRepo['findById'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select()
            .from(user)
            .where(and(eq(user.id, id), liveWhere))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const findByEmail: TUserRepo['findByEmail'] = (email) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select()
            .from(user)
            .where(eq(user.email, email.toLowerCase()))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const create: TUserRepo['create'] = ({
      name,
      email,
      password,
      role,
      isActive,
    }) =>
      Effect.tryPromise({
        try: async () => {
          const ctx = await auth.$context;
          const created = await ctx.internalAdapter.createUser(
            {
              name,
              email: email.toLowerCase(),
              emailVerified: true,
              role,
              isActive,
            },
            { method: USER_PROVISIONING_METHOD }
          );
          const hashed = await ctx.password.hash(password);
          await ctx.internalAdapter.linkAccount({
            providerId: AUTH_PROVIDER.CREDENTIAL,
            accountId: created.id,
            userId: created.id,
            password: hashed,
          });
          const [row] = await db
            .select()
            .from(user)
            .where(eq(user.id, created.id))
            .limit(1);
          return row as TUserRow;
        },
        catch: (cause) =>
          isUniqueViolation(cause)
            ? new EConflict({ message: USER_MESSAGE.EMAIL_TAKEN })
            : new EAuth({ cause }),
      });

    const update: TUserRepo['update'] = ({ id, ...patch }) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .update(user)
            .set(D.merge(patch, { updatedAt: new Date() }))
            .where(and(eq(user.id, id), liveWhere))
            .returning();
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const setActive: TUserRepo['setActive'] = (input) =>
      Effect.tryPromise({
        try: () => userActiveWrite(db, input),
        catch: (cause) => new EDatabase({ cause }),
      });

    const remove: TUserRepo['remove'] = (id) =>
      Effect.tryPromise({
        try: () => userSoftDelete(db, id),
        catch: (cause) => new EDatabase({ cause }),
      });

    const resetPassword: TUserRepo['resetPassword'] = ({ id, password }) =>
      Effect.tryPromise({
        try: async () => {
          const ctx = await auth.$context;
          const hashed = await ctx.password.hash(password);
          await ctx.internalAdapter.updatePassword(id, hashed);
          await db.delete(session).where(eq(session.userId, id));
        },
        catch: (cause) => new EAuth({ cause }),
      });

    return UserRepo.of({
      list,
      findById,
      findByEmail,
      create,
      update,
      setActive,
      remove,
      resetPassword,
    });
  })
);
