import { MENTOR_MESSAGE } from '@app/messages';
import type {
  TMentorIdInput,
  TMentorPublic,
  TMentorUserIdInput,
} from '@app/schemas';
import { Effect } from 'effect';
import { toMentorPublicDto } from '#/mentor/application/to-mentor-dto.ts';
import {
  MentorRepo,
  type TMentorRepoId,
  type TMentorRow,
} from '#/mentor/domain/mentor.ts';
import { mentorIsPublic } from '#/mentor/domain/mentor-status.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

const publicOnly = Effect.fn('publicOnly')(function* (
  row: TMentorRow | null
): Effect.fn.Return<TMentorPublic, ENotFound> {
  if (row === null || !mentorIsPublic(row.status)) {
    return yield* new ENotFound({ message: MENTOR_MESSAGE.NOT_FOUND });
  }

  return toMentorPublicDto(row);
});

export const mentorGet = Effect.fn('mentorGet')(function* ({
  id,
}: TMentorIdInput): Effect.fn.Return<
  TMentorPublic,
  ENotFound | EDatabase,
  TMentorRepoId
> {
  const mentorRepo = yield* MentorRepo;
  return yield* publicOnly(yield* mentorRepo.findById(id));
});

export const mentorGetByUser = Effect.fn('mentorGetByUser')(function* ({
  userId,
}: TMentorUserIdInput): Effect.fn.Return<
  TMentorPublic,
  ENotFound | EDatabase,
  TMentorRepoId
> {
  const mentorRepo = yield* MentorRepo;
  return yield* publicOnly(yield* mentorRepo.findByUserId(userId));
});
