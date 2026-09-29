import { PERMISSION } from '@app/permissions';
import { mentorDelete } from '#/mentor/application/mentor-delete.ts';
import { mentorDocumentDownload } from '#/mentor/application/mentor-document-download.ts';
import { mentorDocumentUpload } from '#/mentor/application/mentor-document-upload.ts';
import { mentorList } from '#/mentor/application/mentor-list.ts';
import { mentorMe } from '#/mentor/application/mentor-me.ts';
import { mentorMeUpdate } from '#/mentor/application/mentor-me-update.ts';
import {
  mentorGet,
  mentorGetByUser,
} from '#/mentor/application/mentor-public-get.ts';
import { mentorRegister } from '#/mentor/application/mentor-register.ts';
import { mentorReviewGet } from '#/mentor/application/mentor-review-get.ts';
import { mentorReviewList } from '#/mentor/application/mentor-review-list.ts';
import { mentorUpdate } from '#/mentor/application/mentor-update.ts';
import { mentorVerify } from '#/mentor/application/mentor-verify.ts';
import { implementer, permissionGuarded } from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';

const mentorRouter = implementer.mentor.router({
  list: implementer.mentor.list.handler(({ input, context }) =>
    effectRun(context.runtime, mentorList(input))
  ),

  get: implementer.mentor.get.handler(({ input, context }) =>
    effectRun(context.runtime, mentorGet(input))
  ),

  getByUser: implementer.mentor.getByUser.handler(({ input, context }) =>
    effectRun(context.runtime, mentorGetByUser(input))
  ),

  me: permissionGuarded(PERMISSION.MENTOR_REGISTER).mentor.me.handler(
    ({ context }) =>
      effectRun(context.runtime, mentorMe(context.session.user.id))
  ),

  register: permissionGuarded(
    PERMISSION.MENTOR_REGISTER
  ).mentor.register.handler(({ input, context }) =>
    effectRun(context.runtime, mentorRegister(input, context.session.user.id))
  ),

  meUpdate: permissionGuarded(
    PERMISSION.MENTOR_PROFILE_UPDATE
  ).mentor.meUpdate.handler(({ input, context }) =>
    effectRun(context.runtime, mentorMeUpdate(input, context.session.user.id))
  ),

  documentUpload: permissionGuarded(
    PERMISSION.MENTOR_REGISTER
  ).mentor.documentUpload.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      mentorDocumentUpload(input, context.session.user.id)
    )
  ),

  reviewList: permissionGuarded(
    PERMISSION.MENTOR_VERIFY
  ).mentor.reviewList.handler(({ input, context }) =>
    effectRun(context.runtime, mentorReviewList(input))
  ),

  reviewGet: permissionGuarded(
    PERMISSION.MENTOR_VERIFY
  ).mentor.reviewGet.handler(({ input, context }) =>
    effectRun(context.runtime, mentorReviewGet(input))
  ),

  documentDownload: permissionGuarded(
    PERMISSION.MENTOR_VERIFY
  ).mentor.documentDownload.handler(({ input, context }) =>
    effectRun(context.runtime, mentorDocumentDownload(input))
  ),

  verify: permissionGuarded(PERMISSION.MENTOR_VERIFY).mentor.verify.handler(
    ({ input, context }) =>
      effectRun(context.runtime, mentorVerify(input, context.session.user.id))
  ),

  update: permissionGuarded(PERMISSION.MENTOR_UPDATE).mentor.update.handler(
    ({ input, context }) =>
      effectRun(context.runtime, mentorUpdate(input, context.session.user.id))
  ),

  remove: permissionGuarded(PERMISSION.MENTOR_DELETE).mentor.remove.handler(
    ({ input, context }) =>
      effectRun(context.runtime, mentorDelete(input, context.session.user.id))
  ),
});

export type TMentorRouter = typeof mentorRouter;

export const mentorRouterBuild = (): TMentorRouter => mentorRouter;
