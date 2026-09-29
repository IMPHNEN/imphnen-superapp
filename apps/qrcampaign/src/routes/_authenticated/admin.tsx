import { canAll, PERMISSION } from '@app/permissions';
import { sessionEnsure } from '@imphnen-frontend-service/service/session';
import { queryClient } from '@imphnen-frontend-service/utils';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: async (): Promise<void> => {
    const me = await sessionEnsure(queryClient);
    if (!me || !canAll(me.permissions, [PERMISSION.QR_CAMPAIGN_READ])) {
      throw redirect({ to: '/', replace: true });
    }
  },
  component: Outlet,
});
