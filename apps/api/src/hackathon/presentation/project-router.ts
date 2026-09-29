import { PERMISSION } from '@app/permissions';
import { implementer, permissionGuarded } from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';
import { certificateGet } from '#/hackathon/application/certificate-get.ts';
import { certificateMine } from '#/hackathon/application/certificate-mine.ts';
import { messageDelete } from '#/hackathon/application/message-delete.ts';
import { messageList } from '#/hackathon/application/message-list.ts';
import { messageSend } from '#/hackathon/application/message-send.ts';
import { submissionCancel } from '#/hackathon/application/submission-cancel.ts';
import { submissionConfirm } from '#/hackathon/application/submission-confirm.ts';
import { submissionCreate } from '#/hackathon/application/submission-create.ts';
import { submissionGet } from '#/hackathon/application/submission-get.ts';
import { submissionSubmit } from '#/hackathon/application/submission-submit.ts';
import { submissionUpdate } from '#/hackathon/application/submission-update.ts';
import { uploadCreate } from '#/hackathon/application/upload-create.ts';
import { winnerList } from '#/hackathon/application/winner-list.ts';
import { viewerOf } from '#/hackathon/presentation/viewer-of.ts';

const participate = (): ReturnType<typeof permissionGuarded> =>
  permissionGuarded(PERMISSION.HACKATHON_PARTICIPATE);

export const messageRouter = implementer.hackathon.message.router({
  list: participate().hackathon.message.list.handler(({ input, context }) =>
    effectRun(context.runtime, messageList(input, context.session.user.id))
  ),

  send: participate().hackathon.message.send.handler(({ input, context }) =>
    effectRun(context.runtime, messageSend(input, context.session.user.id))
  ),

  remove: participate().hackathon.message.remove.handler(({ input, context }) =>
    effectRun(context.runtime, messageDelete(input, context.session.user.id))
  ),
});

export const submissionRouter = implementer.hackathon.submission.router({
  getByTeam: participate().hackathon.submission.getByTeam.handler(
    ({ input, context }) =>
      effectRun(context.runtime, submissionGet(input, viewerOf(context)))
  ),

  create: participate().hackathon.submission.create.handler(
    ({ input, context }) =>
      effectRun(
        context.runtime,
        submissionCreate(input, context.session.user.id)
      )
  ),

  update: participate().hackathon.submission.update.handler(
    ({ input, context }) =>
      effectRun(
        context.runtime,
        submissionUpdate(input, context.session.user.id)
      )
  ),

  submit: participate().hackathon.submission.submit.handler(
    ({ input, context }) =>
      effectRun(
        context.runtime,
        submissionSubmit(input, context.session.user.id)
      )
  ),

  confirm: participate().hackathon.submission.confirm.handler(
    ({ input, context }) =>
      effectRun(
        context.runtime,
        submissionConfirm(input, context.session.user.id)
      )
  ),

  cancel: participate().hackathon.submission.cancel.handler(
    ({ input, context }) =>
      effectRun(
        context.runtime,
        submissionCancel(input, context.session.user.id)
      )
  ),
});

export const uploadRouter = implementer.hackathon.upload.router({
  create: participate().hackathon.upload.create.handler(({ input, context }) =>
    effectRun(context.runtime, uploadCreate(input))
  ),
});

export const winnerRouter = implementer.hackathon.winner.router({
  list: implementer.hackathon.winner.list.handler(({ context }) =>
    effectRun(context.runtime, winnerList())
  ),
});

export const certificateRouter = implementer.hackathon.certificate.router({
  mine: participate().hackathon.certificate.mine.handler(({ context }) =>
    effectRun(context.runtime, certificateMine(context.session.user.id))
  ),

  get: implementer.hackathon.certificate.get.handler(({ input, context }) =>
    effectRun(context.runtime, certificateGet(input))
  ),
});
