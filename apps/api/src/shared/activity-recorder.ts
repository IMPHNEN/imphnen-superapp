import type { TActivityEntry } from '@app/activity';
import { Context, type Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TActivityRecorder = {
  insert: (entry: TActivityEntry) => Effect.Effect<void, EDatabase>;
};

export type TActivityRecorderId = TServiceId<typeof REPO_TAG.ACTIVITY_RECORDER>;

export const ActivityRecorder = Context.Service<
  TActivityRecorderId,
  TActivityRecorder
>(REPO_TAG.ACTIVITY_RECORDER);
