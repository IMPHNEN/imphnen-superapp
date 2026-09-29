import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { ControlledInputField } from '@imphnen-frontend-service/ui/organisms';
import { useModalLogin } from '@imphnen-frontend-service/utils';
import type { ReactElement } from 'react';
import { usePasswordResetForm } from './_hooks/use-password-reset';

type TResetPasswordSearch = {
  token?: string;
  error?: string;
};

const stringParam = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>): TResetPasswordSearch => ({
    token: stringParam(search.token),
    error: stringParam(search.error),
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage(): ReactElement {
  const { token, error } = Route.useSearch();

  return (
    <section className="my-12 md:my-24 mx-[32px] flex justify-center">
      <div className="bg-white rounded-lg shadow p-7 w-full max-w-[455px] space-y-6">
        <img src="/logos/logo.svg" alt="" className="h-[70px] w-auto mx-auto" />
        <h1 className="text-primary-500 text-p1 text-center font-semibold">
          Buat Password Baru
        </h1>
        {token && !error ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="text-neutral-500 text-center">
            Link reset password tidak valid atau sudah kedaluwarsa. Minta link
            baru lewat menu Forgot Password.
          </p>
        )}
      </div>
    </section>
  );
}

function ResetPasswordForm({ token }: { token: string }): ReactElement {
  const navigate = useNavigate();
  const { setShowModalLogin } = useModalLogin();
  const { form, onSubmit, isPending } = usePasswordResetForm(token, () => {
    void navigate({ to: '/' });
    setShowModalLogin(true);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ControlledInputField
        control={form.control}
        name="newPassword"
        label="Password Baru"
        placeholder="Masukkan Password Baru"
        type="password"
        size="lg"
        className="w-full"
      />
      <ControlledInputField
        control={form.control}
        name="confirmPassword"
        label="Ulang Password"
        placeholder="Masukkan Ulang Password"
        type="password"
        size="lg"
        className="w-full"
      />
      <Button
        type="submit"
        size="md"
        className="w-full"
        disabled={isPending || !form.formState.isValid}
      >
        {isPending ? 'Menyimpan...' : 'Buat Password Baru'}
      </Button>
    </form>
  );
}
