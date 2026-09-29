import { sessionEnsure } from '@imphnen-frontend-service/service/session';
import { queryClient } from '@imphnen-frontend-service/utils';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import type { ReactElement } from 'react';

export const Route = createFileRoute('/_public')({
  beforeLoad: async (): Promise<void> => {
    const me = await sessionEnsure(queryClient);
    if (me) throw redirect({ to: '/', replace: true });
  },
  component: PublicLayout,
});

function PublicLayout(): ReactElement {
  return <Outlet />;
}
