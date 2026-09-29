import {
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
  type TActivityAction,
  type TActivityDetails,
  type TActivityEntry,
} from '@app/activity';
import type { TMentorRow } from '#/mentor/domain/mentor.ts';

export const mentorActivityEntry = (
  actorId: string,
  action: TActivityAction,
  row: TMentorRow,
  details: TActivityDetails = {}
): TActivityEntry => ({
  actorId,
  action,
  resourceType: ACTIVITY_RESOURCE_TYPE.MENTOR,
  resourceId: row.id,
  metadata: activityDetails({
    [ACTIVITY_DETAIL.NAME]: row.name,
    [ACTIVITY_DETAIL.EMAIL]: row.email,
    ...details,
  }),
});
