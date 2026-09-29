import {
  gachaClaimAdminSchema,
  gachaClaimSchema,
  type TGachaClaim,
  type TGachaClaimAdmin,
} from '@app/schemas';
import type {
  TGachaClaimAdminRow,
  TGachaClaimRow,
} from '#/gacha/domain/gacha-claim.ts';

const claimFieldsOf = (row: TGachaClaimRow): TGachaClaim => ({
  id: row.id,
  item: row.item,
  source: row.source,
  status: row.status,
  quantity: row.quantity,
  fulfilledAt: row.fulfilledAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const toGachaClaimDto = (row: TGachaClaimRow): TGachaClaim =>
  gachaClaimSchema.parse(claimFieldsOf(row));

export const toGachaClaimAdminDto = (
  row: TGachaClaimAdminRow
): TGachaClaimAdmin =>
  gachaClaimAdminSchema.parse({
    ...claimFieldsOf(row),
    user: row.user,
    fulfilledBy: row.fulfilledBy,
  });
