import { user } from '#/platform/db/tables/auth.ts';
import { gachaClaim, gachaItem } from '#/platform/db/tables/gacha.ts';

export const gachaClaimItemFields = {
  id: gachaItem.id,
  code: gachaItem.code,
  name: gachaItem.name,
};

export const gachaClaimFields = {
  id: gachaClaim.id,
  userId: gachaClaim.userId,
  source: gachaClaim.source,
  status: gachaClaim.status,
  quantity: gachaClaim.quantity,
  fulfilledAt: gachaClaim.fulfilledAt,
  fulfilledBy: gachaClaim.fulfilledBy,
  createdAt: gachaClaim.createdAt,
  updatedAt: gachaClaim.updatedAt,
  item: gachaClaimItemFields,
};

export const gachaClaimAdminFields = {
  ...gachaClaimFields,
  user: { id: user.id, name: user.name, email: user.email },
};
