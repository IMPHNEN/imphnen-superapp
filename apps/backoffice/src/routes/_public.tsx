import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';
import {
  SESSION_STATUS,
  useCurrentUser,
} from '@imphnen-frontend-service/service/session';
import { FullPageSpinner } from '../components/session-screens';
import { firstAllowedPage } from '../libs/access';

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
});

function PublicLayout() {
  const { me, status } = useCurrentUser();
  const landing = me ? firstAllowedPage(me.permissions) : undefined;

  if (status === SESSION_STATUS.LOADING) return <FullPageSpinner />;
  if (landing) return <Navigate to={landing} />;

  return (
    <main className="bg-primary-50 min-h-screen">
      <Outlet />
    </main>
  );
}
