import { createFileRoute, Navigate } from '@tanstack/react-router';
import {
  SESSION_STATUS,
  useCurrentUser,
} from '@imphnen-frontend-service/service/session';
import { FullPageSpinner } from '../components/session-screens';
import { firstAllowedPage } from '../libs/access';

export const Route = createFileRoute('/')({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { me, status } = useCurrentUser();

  if (status === SESSION_STATUS.LOADING) return <FullPageSpinner />;
  const landing = me ? firstAllowedPage(me.permissions) : undefined;
  return <Navigate to={landing ?? '/auth/login'} />;
}
