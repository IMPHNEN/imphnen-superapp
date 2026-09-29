import { createFileRoute, Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import {
  ControlledInputField,
  RegisterResetBanner,
} from '@imphnen-frontend-service/ui/organisms';
import { ForgotStep } from '@imphnen-frontend-service/ui/molecules';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { useResetPasswordForm } from '../../../_hooks/use-password-reset';

export const Route = createFileRoute('/_public/auth/forgot_/summon')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: ForgotSummonPage,
});

function ForgotSummonPage(): ReactElement {
  const { token } = Route.useSearch();
  const { form, onSubmit, isLoading } = useResetPasswordForm(token);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen py-[60px] px-[80px]">
      <div className="bg-white min-w-[1120px] min-h-[712px] p-10 rounded-2xl shadow-md flex gap-6">
        <RegisterResetBanner />
        <div className="border-2 border-primary-500/50 w-[596px] rounded-lg py-[70px] px-[48px] flex flex-col justify-center">
          <ForgotStep step={3} />
          <h3 className="mt-5 text-3xl font-semibold text-primary-500">
            Forgot Password
          </h3>
          <h5 className="mt-2 text-md font-medium text-primary-500">
            Sekarang, buatlah password baru yang lebih kuat, seperti jurus
            andalanmu!
            <span role="img" aria-label="emoji">
              🔥⚡
            </span>
          </h5>
          {!token && (
            <p className="mt-4 text-sm text-red-600">
              Link reset password tidak valid.{' '}
              <Link to="/auth/forgot" className="underline">
                Minta link baru
              </Link>
            </p>
          )}
          <form id="reset-password-form" onSubmit={onSubmit} className="my-4">
            <ControlledInputField
              label="Password Baru"
              name="password"
              type="password"
              size="lg"
              control={form.control}
              placeholder="Buat password sekokoh armor legendary!"
              disabled={isLoading || !token}
            />
            <div className="mt-5">
              <ControlledInputField
                label="Ulang Password Baru"
                name="confirm_password"
                type="password"
                size="lg"
                control={form.control}
                placeholder="Pastikan Cocok! Jangan sampai ada typo, Senpai~!"
                disabled={isLoading || !token}
              />
            </div>
          </form>
          <div className="mb-4 text-gray-700 flex flex-col gap-3 text-sm">
            <h6>
              <span role="img" aria-label="emoji">
                💡
              </span>{' '}
              Tips dari kami:
            </h6>
            <h6>
              <span role="img" aria-label="emoji">
                ✅{' '}
              </span>{' '}
              Buat kombinasi huruf besar, kecil, angka, dan simbol untuk
              kekuatan maksimal!
            </h6>
            <h6>
              <span role="img" aria-label="emoji">
                ✅
              </span>{' '}
              Pastikan kamu ingat password-mu atau simpan di tempat aman~
            </h6>
            <h6>
              Masukkan password baru dan bersiaplah untuk kembali bertualang!
            </h6>
          </div>
          <Button
            type="submit"
            form="reset-password-form"
            className="mt-5"
            disabled={!token || !form.formState.isValid || isLoading}
          >
            {isLoading ? 'Memproses...' : 'Summon Password Baru!'}
          </Button>
        </div>
      </div>
    </div>
  );
}
