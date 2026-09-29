import type { TPermission } from '@app/permissions';
import type { TAppRuntime } from '#/bootstrap/compose.ts';
import type { TSession, TSessionState } from '#/shared/session.ts';

export type TORPCContext = {
  headers: Headers;
  session: TSession | null;
  sessionState: TSessionState;
  permissions: readonly TPermission[];
  runtime: TAppRuntime;
};
