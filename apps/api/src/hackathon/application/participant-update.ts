import { HACKATHON_MESSAGE } from '@app/messages';
import type {
  THackathonParticipant,
  THackathonParticipantUpdateInput,
} from '@app/schemas';
import { Effect } from 'effect';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';
import {
  ParticipantRepo,
  type TParticipantRepoId,
} from '#/hackathon/domain/participant-repo.ts';
import { toParticipantDto } from '#/hackathon/application/to-award-dto.ts';

export const participantUpdate = Effect.fn('participantUpdate')(function* (
  input: THackathonParticipantUpdateInput,
  userId: string
): Effect.fn.Return<
  THackathonParticipant,
  ENotFound | EDatabase,
  TParticipantRepoId
> {
  const participantRepo = yield* ParticipantRepo;
  const row = yield* participantRepo.upsert(input, userId);

  if (row === null) {
    return yield* new ENotFound({
      message: HACKATHON_MESSAGE.PARTICIPANT_NOT_FOUND,
    });
  }

  return toParticipantDto(row);
});
