import { createFileRoute, redirect } from '@tanstack/react-router';
import { sessionEnsure } from '@imphnen-frontend-service/service/session';
import { queryClient } from '@imphnen-frontend-service/utils';
import { firstAllowedPage } from '../libs/access';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const me = await sessionEnsure(queryClient);
    const landing = me ? firstAllowedPage(me.permissions) : undefined;
    throw redirect({ to: landing ?? '/auth/login', replace: true });
  },
});
