import { and, count, desc, eq, gt, ne, sql } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { DbService } from '#/platform/db/db-service.ts';
import { qrCampaign } from '#/platform/db/tables/qr.ts';
import {
  QrCampaignRepo,
  type TQrCampaignRepo,
} from '#/qr/domain/qr-campaign.ts';
import { EDatabase } from '#/shared/errors.ts';
import { offsetFor } from '#/shared/pagination.ts';

const activeWhere = eq(qrCampaign.isActive, true);

export const qrCampaignRepoLayer = Layer.effect(
  QrCampaignRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const list: TQrCampaignRepo['list'] = (input) =>
      Effect.tryPromise({
        try: async () => {
          const [items, [{ value: total }]] = await Promise.all([
            db
              .select()
              .from(qrCampaign)
              .limit(input.pageSize)
              .offset(offsetFor(input))
              .orderBy(desc(qrCampaign.createdAt)),
            db.select({ value: count() }).from(qrCampaign),
          ]);
          return { items, total };
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const findById: TQrCampaignRepo['findById'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select()
            .from(qrCampaign)
            .where(eq(qrCampaign.id, id))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const findActive: TQrCampaignRepo['findActive'] = (now) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select()
            .from(qrCampaign)
            .where(and(activeWhere, gt(qrCampaign.expiresAt, now)))
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const createActive: TQrCampaignRepo['createActive'] = (values) =>
      Effect.tryPromise({
        try: async () => {
          const now = new Date();
          const [, [row]] = await db.batch([
            db
              .update(qrCampaign)
              .set({ isActive: false, updatedAt: now })
              .where(activeWhere),
            db
              .insert(qrCampaign)
              .values({ ...values, isActive: true })
              .returning(),
          ]);
          return row;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const activate: TQrCampaignRepo['activate'] = (id, now) =>
      Effect.tryPromise({
        try: async () => {
          const targetLive = and(
            eq(qrCampaign.id, id),
            gt(qrCampaign.expiresAt, now)
          );
          const [, [row]] = await db.batch([
            db
              .update(qrCampaign)
              .set({ isActive: false, updatedAt: now })
              .where(
                and(
                  activeWhere,
                  ne(qrCampaign.id, id),
                  sql`exists(select 1 from ${qrCampaign} where ${targetLive})`
                )
              ),
            db
              .update(qrCampaign)
              .set({ isActive: true, updatedAt: now })
              .where(targetLive)
              .returning(),
          ]);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const remove: TQrCampaignRepo['remove'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .delete(qrCampaign)
            .where(eq(qrCampaign.id, id))
            .returning();
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return QrCampaignRepo.of({
      list,
      findById,
      findActive,
      createActive,
      activate,
      remove,
    });
  })
);
