import type { TMentoringSession, TMentoringSessionIdInput } from '@app/schemas';
import { Effect } from 'effect';
import { sessionVisible } from '#/mentoring/application/session-visible.ts';
import { toSessionDto } from '#/mentoring/application/to-session-dto.ts';
import type { TMentoringSessionRepoId } from '#/mentoring/domain/mentoring-session.ts';
import type { TSessionActor } from '#/mentoring/domain/session-actor.ts';
import type { EDatabase, ENotFound } from '#/shared/errors.ts';

export const mentoringGet = Effect.fn('mentoringGet')(function* (
  { id }: TMentoringSessionIdInput,
  actor: TSessionActor
): Effect.fn.Return<
  TMentoringSession,
  ENotFound | EDatabase,
  TMentoringSessionRepoId
> {
  const { row } = yield* sessionVisible(id, actor);
  return toSessionDto(row);
});
