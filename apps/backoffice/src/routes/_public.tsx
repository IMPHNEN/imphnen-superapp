import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { sessionEnsure } from '@imphnen-frontend-service/service/session';
import { queryClient } from '@imphnen-frontend-service/utils';
import { firstAllowedPage } from '../libs/access';

export const Route = createFileRoute('/_public')({
  beforeLoad: async () => {
    const me = await sessionEnsure(queryClient);
    const landing = me ? firstAllowedPage(me.permissions) : undefined;
    if (landing) throw redirect({ to: landing, replace: true });
  },
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <main className="bg-primary-50 min-h-screen">
      <Outlet />
    </main>
  );
}
