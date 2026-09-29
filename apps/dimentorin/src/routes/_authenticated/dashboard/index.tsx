import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import { resolvePersona } from './_data/persona-resolver';

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: DashboardIndexPage,
});

function DashboardIndexPage() {
  const { me, status } = useCurrentUser();

  if (status === 'loading') return null;

  const persona = resolvePersona(
    me?.user,
    new URLSearchParams(globalThis.location.search)
  );

  return (
    <Navigate
      to={persona === 'mentor' ? '/dashboard/mentor' : '/dashboard/user'}
    />
  );
}
