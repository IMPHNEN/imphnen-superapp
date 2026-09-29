import { PERMISSION } from '@app/permissions';
import { gachaClaimFulfil } from '#/gacha/application/claim/gacha-claim-fulfil.ts';
import { gachaClaimList } from '#/gacha/application/claim/gacha-claim-list.ts';
import { gachaClaimMine } from '#/gacha/application/claim/gacha-claim-mine.ts';
import { gachaCreditGrant } from '#/gacha/application/credit/gacha-credit-grant.ts';
import { gachaCreditMine } from '#/gacha/application/credit/gacha-credit-mine.ts';
import { gachaItemCreate } from '#/gacha/application/item/gacha-item-create.ts';
import { gachaItemDelete } from '#/gacha/application/item/gacha-item-delete.ts';
import { gachaItemGet } from '#/gacha/application/item/gacha-item-get.ts';
import { gachaItemList } from '#/gacha/application/item/gacha-item-list.ts';
import { gachaItemUpdate } from '#/gacha/application/item/gacha-item-update.ts';
import { gachaRoll } from '#/gacha/application/roll/gacha-roll.ts';
import { implementer, permissionGuarded } from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';

const gachaRouter = implementer.gacha.router({
  item: {
    list: permissionGuarded(PERMISSION.GACHA_ITEM_READ).gacha.item.list.handler(
      ({ input, context }) => effectRun(context.runtime, gachaItemList(input))
    ),

    get: permissionGuarded(PERMISSION.GACHA_ITEM_READ).gacha.item.get.handler(
      ({ input, context }) => effectRun(context.runtime, gachaItemGet(input))
    ),

    create: permissionGuarded(
      PERMISSION.GACHA_ITEM_CREATE
    ).gacha.item.create.handler(({ input, context }) =>
      effectRun(
        context.runtime,
        gachaItemCreate(input, context.session.user.id)
      )
    ),

    update: permissionGuarded(
      PERMISSION.GACHA_ITEM_UPDATE
    ).gacha.item.update.handler(({ input, context }) =>
      effectRun(
        context.runtime,
        gachaItemUpdate(input, context.session.user.id)
      )
    ),

    remove: permissionGuarded(
      PERMISSION.GACHA_ITEM_DELETE
    ).gacha.item.remove.handler(({ input, context }) =>
      effectRun(
        context.runtime,
        gachaItemDelete(input, context.session.user.id)
      )
    ),
  },

  credit: {
    mine: permissionGuarded(
      PERMISSION.GACHA_CREDIT_READ
    ).gacha.credit.mine.handler(({ context }) =>
      effectRun(context.runtime, gachaCreditMine(context.session.user.id))
    ),

    grant: permissionGuarded(
      PERMISSION.GACHA_CREDIT_GRANT
    ).gacha.credit.grant.handler(({ input, context }) =>
      effectRun(
        context.runtime,
        gachaCreditGrant(input, context.session.user.id)
      )
    ),
  },

  roll: {
    execute: permissionGuarded(
      PERMISSION.GACHA_ROLL
    ).gacha.roll.execute.handler(({ context }) =>
      effectRun(context.runtime, gachaRoll(context.session.user.id))
    ),
  },

  claim: {
    mine: permissionGuarded(
      PERMISSION.GACHA_CLAIM_READ
    ).gacha.claim.mine.handler(({ input, context }) =>
      effectRun(context.runtime, gachaClaimMine(input, context.session.user.id))
    ),

    list: permissionGuarded(
      PERMISSION.GACHA_CLAIM_MANAGE
    ).gacha.claim.list.handler(({ input, context }) =>
      effectRun(context.runtime, gachaClaimList(input))
    ),

    fulfil: permissionGuarded(
      PERMISSION.GACHA_CLAIM_MANAGE
    ).gacha.claim.fulfil.handler(({ input, context }) =>
      effectRun(
        context.runtime,
        gachaClaimFulfil(input, context.session.user.id)
      )
    ),
  },
});

export type TGachaRouter = typeof gachaRouter;

export const gachaRouterBuild = (): TGachaRouter => gachaRouter;
