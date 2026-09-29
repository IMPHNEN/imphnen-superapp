import { profileAvatarUpload } from '#/profile/application/profile-avatar-upload.ts';
import { profileGet } from '#/profile/application/profile-get.ts';
import { profileUpdate } from '#/profile/application/profile-update.ts';
import { implementer, sessionGuarded } from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';

const profileRouter = implementer.profile.router({
  get: sessionGuarded.profile.get.handler(({ context }) =>
    effectRun(context.runtime, profileGet(context.session.user.id))
  ),

  update: sessionGuarded.profile.update.handler(({ input, context }) =>
    effectRun(context.runtime, profileUpdate(context.session.user.id, input))
  ),

  avatarUpload: sessionGuarded.profile.avatarUpload.handler(
    ({ input, context }) =>
      effectRun(
        context.runtime,
        profileAvatarUpload(context.session.user.id, input)
      )
  ),
});

export type TProfileRouter = typeof profileRouter;

export const profileRouterBuild = (): TProfileRouter => profileRouter;
