import { useSignOut } from '@imphnen-frontend-service/service/session';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { useNavigate } from '@tanstack/react-router';
import type { FC, ReactElement } from 'react';

export const FullPageSpinner: FC = (): ReactElement => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="size-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-primary-500" />
  </div>
);

type TAccessDeniedProps = {
  title?: string;
  description?: string;
  showSignOut?: boolean;
};

export const AccessDenied: FC<TAccessDeniedProps> = ({
  title = 'Akses ditolak',
  description = 'Akun ini tidak memiliki izin untuk membuka halaman ini.',
  showSignOut = false,
}): ReactElement => {
  const navigate = useNavigate();
  const signOut = useSignOut();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {showSignOut && (
        <Button
          variant="secondary"
          size="md"
          disabled={signOut.isPending}
          onClick={() =>
            signOut.mutate(undefined, {
              onSuccess: (): void => {
                navigate({ to: '/auth/login' });
              },
            })
          }
        >
          Keluar
        </Button>
      )}
    </div>
  );
};
