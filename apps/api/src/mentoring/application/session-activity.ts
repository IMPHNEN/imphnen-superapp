import {
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
  type TActivityAction,
  type TActivityDetails,
  type TActivityEntry,
} from '@app/activity';
import type { TMentoringSessionRow } from '#/mentoring/domain/mentoring-session.ts';

export const sessionActivityEntry = (
  actorId: string,
  action: TActivityAction,
  row: TMentoringSessionRow,
  details: TActivityDetails = {}
): TActivityEntry => ({
  actorId,
  action,
  resourceType: ACTIVITY_RESOURCE_TYPE.MENTORING_SESSION,
  resourceId: row.id,
  metadata: activityDetails({
    [ACTIVITY_DETAIL.TITLE]: row.topic,
    [ACTIVITY_DETAIL.LABEL]: row.status,
    ...details,
  }),
});
