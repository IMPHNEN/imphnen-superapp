import { USER_MESSAGE } from '@app/messages';
import { D } from '@mobily/ts-belt';
import { and, count, eq, or, type SQL } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { match, P } from 'ts-pattern';
import { EAuth, EConflict, EDatabase } from '#/shared/errors.ts';
import { offsetFor, orderFor } from '#/shared/pagination.ts';
import { USER_SORT, type TUserSort } from '@app/schemas';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { UserRepo, type TUserRepo, type TUserRow } from '#/user/domain/user.ts';
import { AuthService } from '#/auth/index.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { containsWhere } from '#/platform/db/search.ts';
import { isUniqueViolation } from '#/platform/db/unique-violation.ts';
import { session, user } from '#/platform/db/tables/auth.ts';

const CREDENTIAL_PROVIDER_ID = 'credential';
const USER_PROVISIONING_METHOD = 'admin';

const SORT_COLUMN: Record<TUserSort, AnySQLiteColumn> = {
  [USER_SORT.NAME]: user.name,
  [USER_SORT.EMAIL]: user.email,
  [USER_SORT.ROLE]: user.role,
  [USER_SORT.CREATED_AT]: user.createdAt,
};

const searchWhere = (search: string | undefined): SQL | undefined =>
  match(search)
    .with(P.nonNullable, (value) =>
      or(containsWhere(user.name, value), containsWhere(user.email, value))
    )
    .otherwise(() => undefined);

const roleWhere = (role: string | undefined): SQL | undefined =>
  match(role)
    .with(P.nonNullable, (value) => eq(user.role, value))
    .otherwise(() => undefined);

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
      sortBy,
      sortDir,
    }) => {
      const where = and(searchWhere(search), roleWhere(role));

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
            .where(eq(user.id, id))
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

    const create: TUserRepo['create'] = ({ name, email, password, role }) =>
      Effect.tryPromise({
        try: async () => {
          const ctx = await auth.$context;
          const created = await ctx.internalAdapter.createUser(
            { name, email: email.toLowerCase(), emailVerified: false, role },
            { method: USER_PROVISIONING_METHOD }
          );
          const hashed = await ctx.password.hash(password);
          await ctx.internalAdapter.linkAccount({
            providerId: CREDENTIAL_PROVIDER_ID,
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
            .where(eq(user.id, id))
            .returning();
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const remove: TUserRepo['remove'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const result = await db
            .delete(user)
            .where(eq(user.id, id))
            .returning({ id: user.id });
          return result.length > 0;
        },
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
      remove,
      resetPassword,
    });
  })
);
