import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { PageLoader } from '../components/PageLoader';

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
});

function PublicLayout(): ReactElement {
  const { status } = useCurrentUser();

  if (status === 'loading') return <PageLoader />;
  if (status === 'authenticated') return <Navigate to="/" />;

  return <Outlet />;
}
