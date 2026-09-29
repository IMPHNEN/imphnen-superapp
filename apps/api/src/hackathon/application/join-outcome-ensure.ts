import { HACKATHON_MESSAGE } from '@app/messages';
import { Effect } from 'effect';
import { match } from 'ts-pattern';
import { EBadRequest, EConflict, ENotFound } from '#/shared/errors.ts';
import {
  JOIN_OUTCOME,
  type TJoinOutcome,
} from '#/hackathon/domain/join-outcome.ts';

type TJoinFailure = ENotFound | EBadRequest | EConflict;

export const joinOutcomeEnsure = (
  outcome: TJoinOutcome,
  notPendingMessage: string
): Effect.Effect<void, TJoinFailure> =>
  match(outcome)
    .with(
      JOIN_OUTCOME.JOINED,
      (): Effect.Effect<void, TJoinFailure> => Effect.void
    )
    .with(JOIN_OUTCOME.TEAM_GONE, () =>
      Effect.fail(new ENotFound({ message: HACKATHON_MESSAGE.TEAM_NOT_FOUND }))
    )
    .with(JOIN_OUTCOME.TEAM_FULL, () =>
      Effect.fail(new EConflict({ message: HACKATHON_MESSAGE.TEAM_FULL }))
    )
    .with(JOIN_OUTCOME.TEAM_LOCKED, () =>
      Effect.fail(new EConflict({ message: HACKATHON_MESSAGE.TEAM_LOCKED }))
    )
    .with(JOIN_OUTCOME.NOT_PENDING, () =>
      Effect.fail(new EBadRequest({ message: notPendingMessage }))
    )
    .exhaustive();
