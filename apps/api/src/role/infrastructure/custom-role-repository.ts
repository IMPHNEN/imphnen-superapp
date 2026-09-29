import { ROLE_MESSAGE } from '@app/messages';
import { A, D } from '@mobily/ts-belt';
import { count, eq } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { EConflict, EDatabase } from '#/shared/errors.ts';
import {
  CustomRoleRepo,
  type TCustomRoleRepo,
  type TCustomRoleRow,
} from '#/role/domain/custom-role.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { isUniqueViolation } from '#/platform/db/unique-violation.ts';
import { customRole } from '#/platform/db/tables/custom-role.ts';
import { user } from '#/platform/db/tables/auth.ts';

export const customRoleRepoLayer = Layer.effect(
  CustomRoleRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const memberCounts: TCustomRoleRepo['memberCounts'] = () =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .select({ role: user.role, value: count() })
            .from(user)
            .groupBy(user.role);
          return D.fromPairs(
            A.map(rows, (row) => [row.role, row.value] as const)
          );
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const list: TCustomRoleRepo['list'] = () =>
      Effect.tryPromise({
        try: () => db.select().from(customRole).orderBy(customRole.label),
        catch: (cause) => new EDatabase({ cause }),
      });

    const findByKey: TCustomRoleRepo['findByKey'] = (key) =>
      Effect.tryPromise({
        try: async () => {
          const query = db
            .select()
            .from(customRole)
            .where(eq(customRole.key, key))
            .limit(1)
            .$dynamic();
          const [row] = await query;
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const create: TCustomRoleRepo['create'] = (
      { key, label, description, permissions },
      createdBy
    ) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .insert(customRole)
            .values({
              key,
              label,
              description: description ?? null,
              permissions,
              createdBy,
            })
            .returning();
          return row as TCustomRoleRow;
        },
        catch: (cause) =>
          isUniqueViolation(cause)
            ? new EConflict({ message: ROLE_MESSAGE.KEY_TAKEN })
            : new EDatabase({ cause }),
      });

    const update: TCustomRoleRepo['update'] = ({ key, ...patch }) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .update(customRole)
            .set(D.merge(patch, { updatedAt: new Date() }))
            .where(eq(customRole.key, key))
            .returning();
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const remove: TCustomRoleRepo['remove'] = (key) =>
      Effect.tryPromise({
        try: async () => {
          const result = await db
            .delete(customRole)
            .where(eq(customRole.key, key))
            .returning({ id: customRole.id });
          return result.length > 0;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return CustomRoleRepo.of({
      memberCounts,
      list,
      findByKey,
      create,
      update,
      remove,
    });
  })
);
