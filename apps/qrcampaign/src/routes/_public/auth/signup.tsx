import { zodResolver } from '@hookform/resolvers/zod';
import { Icon } from '@iconify/react';
import {
  useSendVerificationOtp,
  useSignUp,
  useVerifyEmailOtp,
} from '@imphnen-frontend-service/service/session';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { type FormEvent, type ReactElement, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const signupSchema = z
  .object({
    fullname: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Full name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export const Route = createFileRoute('/_public/auth/signup')({
  component: SignupPage,
});

function SignupPage(): ReactElement {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const sendOtp = useSendVerificationOtp();
  const verifyOtp = useVerifyEmailOtp();

  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const isSubmitting = signUp.isPending;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const onSubmit = (data: SignupFormData): void => {
    setError(null);
    signUp.mutate(
      { name: data.fullname, email: data.email, password: data.password },
      {
        onSuccess: () => {
          toast.success('Account created! Check your email for the code.');
          setPendingEmail(data.email);
        },
        onError: (err) => setError(err.message || 'Signup failed'),
      }
    );
  };

  const onVerify = (e: FormEvent): void => {
    e.preventDefault();
    if (!pendingEmail) return;
    setError(null);
    verifyOtp.mutate(
      { email: pendingEmail, otp: otp.trim() },
      {
        onSuccess: () => {
          toast.success('Email verified! Welcome.');
          navigate({ to: '/' });
        },
        onError: (err) => setError(err.message || 'Invalid code'),
      }
    );
  };

  const onResend = (): void => {
    if (!pendingEmail) return;
    sendOtp.mutate(
      { email: pendingEmail },
      {
        onSuccess: () => toast.success('A new code has been sent.'),
        onError: (err) => toast.error(err.message || 'Failed to send code'),
      }
    );
  };

  const inputBaseClass =
    'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed';
  const inputErrorClass = 'border-red-500';
  const inputNormalClass = 'border-gray-300';

  if (pendingEmail) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h2>
            <p className="text-gray-600">
              Enter the code we sent to <strong>{pendingEmail}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={onVerify} className="space-y-4">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                disabled={verifyOtp.isPending}
                className={`${inputBaseClass} ${inputNormalClass} tracking-widest text-center`}
                required
              />
            </div>

            <button
              type="submit"
              disabled={!otp.trim() || verifyOtp.isPending}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {verifyOtp.isPending ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <button
            type="button"
            onClick={onResend}
            disabled={sendOtp.isPending}
            className="w-full mt-4 py-3 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {sendOtp.isPending ? 'Sending...' : 'Resend code'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="cursor-pointer text-primary-500 hover:text-primary-600 text-base font-sans flex items-center"
          >
            <Icon icon="ic:baseline-chevron-left" width="24" height="24" />
            Back to Homepage
          </button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h2>
          <p className="text-gray-600">Join IMPHNEN community</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="fullname"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <input
              id="fullname"
              type="text"
              {...register('fullname')}
              placeholder="John Doe"
              disabled={isSubmitting}
              className={`${inputBaseClass} ${
                errors.fullname ? inputErrorClass : inputNormalClass
              }`}
            />
            {errors.fullname && (
              <p className="mt-1 text-sm text-red-500">
                {errors.fullname.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="yourname@example.com"
              disabled={isSubmitting}
              className={`${inputBaseClass} ${
                errors.email ? inputErrorClass : inputNormalClass
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••"
                disabled={isSubmitting}
                className={`${inputBaseClass} pr-12 ${
                  errors.password ? inputErrorClass : inputNormalClass
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <Icon
                  icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'}
                  className="text-xl"
                />
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="••••••••"
                disabled={isSubmitting}
                className={`${inputBaseClass} pr-12 ${
                  errors.confirmPassword ? inputErrorClass : inputNormalClass
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <Icon
                  icon={showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'}
                  className="text-xl"
                />
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
