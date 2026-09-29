import type { THackathonParticipantUpdateInput } from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';
import type { TParticipantRow } from '#/hackathon/domain/hackathon-rows.ts';

export type TParticipantRepo = {
  find: (userId: string) => Effect.Effect<TParticipantRow | null, EDatabase>;
  upsert: (
    input: THackathonParticipantUpdateInput,
    userId: string
  ) => Effect.Effect<TParticipantRow | null, EDatabase>;
};

export type TParticipantRepoId = TServiceId<
  typeof REPO_TAG.HACKATHON_PARTICIPANT
>;

export const ParticipantRepo = Context.Service<
  TParticipantRepoId,
  TParticipantRepo
>(REPO_TAG.HACKATHON_PARTICIPANT);
