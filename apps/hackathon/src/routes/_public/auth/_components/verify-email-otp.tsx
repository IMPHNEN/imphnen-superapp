import {
  useSendVerificationOtp,
  useVerifyEmailOtp,
} from '@imphnen-frontend-service/service/session';
import { Icon } from '@iconify/react';
import { type FC, type FormEvent, useState } from 'react';
import { toast } from 'sonner';

const OTP_LENGTH = 6;

type TVerifyEmailOtpProps = {
  email: string;
  onVerified: () => void;
  onBack: () => void;
  backLabel: string;
};

export const VerifyEmailOtp: FC<TVerifyEmailOtpProps> = ({
  email,
  onVerified,
  onBack,
  backLabel,
}) => {
  const [otp, setOtp] = useState('');
  const verify = useVerifyEmailOtp();
  const resend = useSendVerificationOtp();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    verify.mutate(
      { email, otp },
      {
        onSuccess: () => {
          toast.success('Email verified!');
          onVerified();
        },
      }
    );
  };

  const handleResend = () => {
    resend.mutate(
      { email },
      {
        onSuccess: () => toast.success('A new code has been sent.'),
        onError: (error) =>
          toast.error(error.message || 'Failed to resend the code'),
      }
    );
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <Icon
              icon="mdi:email-check"
              className="text-3xl text-green-600 dark:text-green-400"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Check Your Email
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a {OTP_LENGTH}-digit verification code to{' '}
            <strong>{email}</strong>
          </p>
        </div>

        {verify.error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">
              {verify.error.message}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            disabled={verify.isPending}
            className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={otp.length !== OTP_LENGTH || verify.isPending}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {verify.isPending ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            The code expires in 5 minutes. Don't forget to check your spam
            folder if you don't see the email.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={resend.isPending}
            className="w-full py-3 text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {resend.isPending ? 'Sending...' : 'Resend code'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {backLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
