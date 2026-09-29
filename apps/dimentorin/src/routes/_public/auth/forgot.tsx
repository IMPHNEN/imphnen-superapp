import { createFileRoute } from '@tanstack/react-router';
import { type ReactElement, useState } from 'react';
import {
  RegisterResetBanner,
  ControlledInputField,
} from '@imphnen-frontend-service/ui/organisms';
import { ForgotStep } from '@imphnen-frontend-service/ui/molecules';
import { useForgotPasswordForm } from '../../_hooks/use-password-reset';

export const Route = createFileRoute('/_public/auth/forgot')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage(): ReactElement {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { form, onSubmit, resend, isLoading } =
    useForgotPasswordForm(setSentTo);
  const step = sentTo ? 2 : 1;

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-5">
      <div className="flex w-[90%] max-w-[1120px] min-h-[732px] bg-white rounded-[48px] shadow-auth border border-border-light overflow-hidden relative z-[1] p-10 gap-6">
        <RegisterResetBanner />

        <div className="flex-1 py-[53px] px-12 bg-white border border-border-light rounded-[48px] flex flex-col items-center justify-start w-full">
          <div className="mb-8 w-full max-w-[493px]">
            <ForgotStep step={step} />
          </div>

          {step === 1 && (
            <form onSubmit={onSubmit} className="w-full max-w-[493px]">
              <div className="mb-8 text-left">
                <h1 className="text-[37px] font-semibold leading-[1.2] text-text-dark mb-2">
                  Lupa Password?
                </h1>
                <p className="text-base font-medium text-text-secondary">
                  Tenang, Senpai! Kami bantu ambil kembali akses akunmu! ✨
                </p>
              </div>

              <div className="mt-6">
                <ControlledInputField
                  label="Email"
                  name="email"
                  size="lg"
                  control={form.control}
                  placeholder="Masukkan email-mu yang terdaftar"
                  disabled={isLoading}
                />
              </div>

              <div className="mt-10">
                <button
                  type="submit"
                  disabled={!form.formState.isValid || isLoading}
                  className="w-full h-[34px] bg-primary-accent text-white rounded-md text-[15px] font-semibold flex items-center justify-center hover:bg-[#1e8cd1] disabled:bg-neutral-400 transition-all duration-200 ease-in-out cursor-pointer"
                >
                  {isLoading ? 'Mengirim...' : 'Kirim Link Reset ^^'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && sentTo && (
            <div className="w-full max-w-[493px]">
              <div className="mb-8 text-left">
                <h1 className="text-[37px] font-semibold leading-[1.2] text-text-dark mb-2">
                  Cek Email-mu!
                </h1>
                <p className="text-base font-medium text-text-secondary">
                  Link untuk summon password baru sudah dikirim ke {sentTo}.
                  Buka link tersebut untuk melanjutkan! 📬
                </p>
              </div>

              <div className="mt-4 text-right">
                <span className="text-sm text-gray-500">Gak dapet email? </span>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => resend(sentTo)}
                  className="text-primary-accent hover:underline cursor-pointer font-medium disabled:text-neutral-400"
                >
                  Kirim Ulang
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
