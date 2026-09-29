import { PERMISSION } from '@app/permissions';
import { mentoringAvailability } from '#/mentoring/application/mentoring-availability.ts';
import { mentoringBook } from '#/mentoring/application/mentoring-book.ts';
import { mentoringCancel } from '#/mentoring/application/mentoring-cancel.ts';
import { mentoringFeedback } from '#/mentoring/application/mentoring-feedback.ts';
import { mentoringGet } from '#/mentoring/application/mentoring-get.ts';
import { mentoringListMine } from '#/mentoring/application/mentoring-list-mine.ts';
import { mentoringManageList } from '#/mentoring/application/mentoring-manage-list.ts';
import { mentoringMenteeList } from '#/mentoring/application/mentoring-mentee-list.ts';
import { mentoringMentorStats } from '#/mentoring/application/mentoring-mentor-stats.ts';
import { mentoringOverview } from '#/mentoring/application/mentoring-overview.ts';
import { mentoringUpdate } from '#/mentoring/application/mentoring-update.ts';
import { sessionActorOf } from '#/mentoring/presentation/session-actor-of.ts';
import { implementer, permissionGuarded } from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';

const mentoringRouter = implementer.mentoring.router({
  availability: implementer.mentoring.availability.handler(
    ({ input, context }) =>
      effectRun(context.runtime, mentoringAvailability(input))
  ),

  book: permissionGuarded(
    PERMISSION.MENTORING_SESSION_CREATE
  ).mentoring.book.handler(({ input, context }) =>
    effectRun(context.runtime, mentoringBook(input, context.session.user.id))
  ),

  listMine: permissionGuarded(
    PERMISSION.MENTORING_SESSION_READ
  ).mentoring.listMine.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      mentoringListMine(input, context.session.user.id)
    )
  ),

  get: permissionGuarded(
    PERMISSION.MENTORING_SESSION_READ
  ).mentoring.get.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      mentoringGet(
        input,
        sessionActorOf(context.session.user.id, context.permissions)
      )
    )
  ),

  update: permissionGuarded(
    PERMISSION.MENTORING_SESSION_UPDATE
  ).mentoring.update.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      mentoringUpdate(
        input,
        sessionActorOf(context.session.user.id, context.permissions)
      )
    )
  ),

  cancel: permissionGuarded(
    PERMISSION.MENTORING_SESSION_CREATE
  ).mentoring.cancel.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      mentoringCancel(
        input,
        sessionActorOf(context.session.user.id, context.permissions)
      )
    )
  ),

  feedbackSubmit: permissionGuarded(
    PERMISSION.MENTORING_SESSION_CREATE
  ).mentoring.feedbackSubmit.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      mentoringFeedback(
        input,
        sessionActorOf(context.session.user.id, context.permissions)
      )
    )
  ),

  manageList: permissionGuarded(
    PERMISSION.MENTORING_SESSION_MANAGE
  ).mentoring.manageList.handler(({ input, context }) =>
    effectRun(context.runtime, mentoringManageList(input))
  ),

  overview: permissionGuarded(
    PERMISSION.MENTORING_SESSION_MANAGE
  ).mentoring.overview.handler(({ context }) =>
    effectRun(context.runtime, mentoringOverview())
  ),

  mentorStats: permissionGuarded(
    PERMISSION.MENTOR_PROFILE_READ
  ).mentoring.mentorStats.handler(({ context }) =>
    effectRun(context.runtime, mentoringMentorStats(context.session.user.id))
  ),

  menteeList: permissionGuarded(
    PERMISSION.MENTOR_PROFILE_READ
  ).mentoring.menteeList.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      mentoringMenteeList(input, context.session.user.id)
    )
  ),
});

export type TMentoringRouter = typeof mentoringRouter;

export const mentoringRouterBuild = (): TMentoringRouter => mentoringRouter;
