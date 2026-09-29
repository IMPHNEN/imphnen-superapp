import { PERMISSION } from '@app/permissions';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';
import type { ReactElement } from 'react';

export const Route = createFileRoute('/_authenticated/admin')({
  component: AdminLayout,
});

function AdminLayout(): ReactElement {
  const { can } = useCurrentUser();

  if (!can(PERMISSION.QR_CAMPAIGN_READ)) return <Navigate to="/" />;

  return <Outlet />;
}
