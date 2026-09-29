import {
  gachaClaimAdminSchema,
  gachaClaimIdInputSchema,
  gachaClaimListInputSchema,
  gachaClaimListSchema,
  gachaClaimMineInputSchema,
  gachaClaimMineListSchema,
  gachaCreditGrantInputSchema,
  gachaCreditSchema,
  gachaItemCreateInputSchema,
  gachaItemIdInputSchema,
  gachaItemIdSchema,
  gachaItemListInputSchema,
  gachaItemListSchema,
  gachaItemSchema,
  gachaItemUpdateInputSchema,
  gachaRollResultSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { z } from 'zod';
import { HTTP_METHOD } from './http-methods.ts';
import { ROUTE_PATH } from './route-paths.ts';

const gachaItemContract = {
  list: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.GACHA_ITEMS })
    .input(gachaItemListInputSchema)
    .output(gachaItemListSchema),

  get: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.GACHA_ITEM })
    .input(gachaItemIdInputSchema)
    .output(gachaItemSchema),

  create: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.GACHA_ITEMS })
    .input(gachaItemCreateInputSchema)
    .output(gachaItemSchema),

  update: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.GACHA_ITEM })
    .input(gachaItemUpdateInputSchema)
    .output(gachaItemSchema),

  remove: oc
    .route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.GACHA_ITEM })
    .input(gachaItemIdInputSchema)
    .output(z.object({ id: gachaItemIdSchema })),
};

const gachaCreditContract = {
  mine: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.GACHA_CREDIT_MINE })
    .output(gachaCreditSchema),

  grant: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.GACHA_CREDIT_GRANTS })
    .input(gachaCreditGrantInputSchema)
    .output(gachaCreditSchema),
};

const gachaRollContract = {
  execute: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.GACHA_ROLLS })
    .output(gachaRollResultSchema),
};

const gachaClaimContract = {
  mine: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.GACHA_CLAIM_MINE })
    .input(gachaClaimMineInputSchema)
    .output(gachaClaimMineListSchema),

  list: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.GACHA_CLAIMS })
    .input(gachaClaimListInputSchema)
    .output(gachaClaimListSchema),

  fulfil: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.GACHA_CLAIM_FULFIL })
    .input(gachaClaimIdInputSchema)
    .output(gachaClaimAdminSchema),
};

export const gachaContract = {
  item: gachaItemContract,
  credit: gachaCreditContract,
  roll: gachaRollContract,
  claim: gachaClaimContract,
};
