import { MENTORING_MESSAGE } from '@app/messages';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import {
  MentoringSessionRepo,
  type TMentoringSessionRepoId,
  type TMentoringSessionRow,
} from '#/mentoring/domain/mentoring-session.ts';
import {
  sessionRolesOf,
  type TSessionActor,
  type TSessionRole,
} from '#/mentoring/domain/session-actor.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export type TVisibleSession = {
  row: TMentoringSessionRow;
  roles: readonly TSessionRole[];
};

export const sessionVisible = Effect.fn('sessionVisible')(function* (
  id: string,
  actor: TSessionActor
): Effect.fn.Return<
  TVisibleSession,
  ENotFound | EDatabase,
  TMentoringSessionRepoId
> {
  const sessionRepo = yield* MentoringSessionRepo;
  const row = yield* sessionRepo.findById(id);

  if (row === null) {
    return yield* new ENotFound({ message: MENTORING_MESSAGE.NOT_FOUND });
  }

  const roles = sessionRolesOf(row, actor);

  if (A.isEmpty(roles)) {
    return yield* new ENotFound({ message: MENTORING_MESSAGE.NOT_FOUND });
  }

  return { row, roles };
});
