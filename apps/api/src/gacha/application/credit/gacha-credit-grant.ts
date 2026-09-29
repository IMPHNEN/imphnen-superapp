import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { GACHA_MESSAGE } from '@app/messages';
import type { TGachaCredit, TGachaCreditGrantInput } from '@app/schemas';
import { Effect } from 'effect';
import { toGachaCreditDto } from '#/gacha/application/credit/to-gacha-credit-dto.ts';
import {
  GachaCreditRepo,
  type TGachaCreditRepoId,
} from '#/gacha/domain/gacha-credit.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export const gachaCreditGrant = Effect.fn('gachaCreditGrant')(function* (
  input: TGachaCreditGrantInput,
  actorId: string
): Effect.fn.Return<
  TGachaCredit,
  ENotFound | EDatabase,
  TGachaCreditRepoId | TActivityRecorderId
> {
  const repo = yield* GachaCreditRepo;
  const activity = yield* ActivityRecorder;

  const recipient = yield* repo.recipientFind(input.userId);

  if (recipient === null) {
    return yield* new ENotFound({
      message: GACHA_MESSAGE.CREDIT_USER_NOT_FOUND,
    });
  }

  const row = yield* repo.grant(recipient.id, input.amount);
  yield* activity.insert({
    actorId,
    action: ACTIVITY_ACTION.GACHA_CREDIT_GRANT,
    resourceType: ACTIVITY_RESOURCE_TYPE.GACHA_CREDIT,
    resourceId: recipient.id,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.EMAIL]: recipient.email,
      [ACTIVITY_DETAIL.LABEL]: input.amount,
    }),
  });

  return toGachaCreditDto(row);
});
