import {
  mentoringAvailabilityInputSchema,
  mentoringAvailabilitySchema,
  mentoringBookInputSchema,
  mentoringFeedbackInputSchema,
  mentoringListMineInputSchema,
  mentoringManageListInputSchema,
  mentoringMenteeListInputSchema,
  mentoringMenteeListSchema,
  mentoringMentorStatsSchema,
  mentoringOverviewSchema,
  mentoringSessionIdInputSchema,
  mentoringSessionListSchema,
  mentoringSessionSchema,
  mentoringUpdateInputSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { HTTP_METHOD } from './http-methods.ts';
import { ROUTE_PATH } from './route-paths.ts';

export const mentoringContract = {
  availability: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.MENTORING_AVAILABILITY })
    .input(mentoringAvailabilityInputSchema)
    .output(mentoringAvailabilitySchema),

  book: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.MENTORING_SESSIONS })
    .input(mentoringBookInputSchema)
    .output(mentoringSessionSchema),

  listMine: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.MENTORING_SESSIONS_MINE,
    })
    .input(mentoringListMineInputSchema)
    .output(mentoringSessionListSchema),

  get: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.MENTORING_SESSION })
    .input(mentoringSessionIdInputSchema)
    .output(mentoringSessionSchema),

  update: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.MENTORING_SESSION })
    .input(mentoringUpdateInputSchema)
    .output(mentoringSessionSchema),

  cancel: oc
    .route({
      method: HTTP_METHOD.POST,
      path: ROUTE_PATH.MENTORING_SESSION_CANCEL,
    })
    .input(mentoringSessionIdInputSchema)
    .output(mentoringSessionSchema),

  feedbackSubmit: oc
    .route({
      method: HTTP_METHOD.POST,
      path: ROUTE_PATH.MENTORING_SESSION_FEEDBACK,
    })
    .input(mentoringFeedbackInputSchema)
    .output(mentoringSessionSchema),

  manageList: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.MENTORING_SESSIONS })
    .input(mentoringManageListInputSchema)
    .output(mentoringSessionListSchema),

  overview: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.MENTORING_SESSIONS_OVERVIEW,
    })
    .output(mentoringOverviewSchema),

  mentorStats: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.MENTORING_MENTOR_STATS })
    .output(mentoringMentorStatsSchema),

  menteeList: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.MENTORING_MENTOR_MENTEES,
    })
    .input(mentoringMenteeListInputSchema)
    .output(mentoringMenteeListSchema),
};
