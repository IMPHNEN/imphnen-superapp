import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useState } from 'react';
import {
  useCurrentUser,
  useSignUp,
} from '@imphnen-frontend-service/service/session';
import { useNavigate, Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { ThemeToggle } from '../../../components/theme-toggle';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VerifyEmailOtp } from './_components/verify-email-otp';

export const Route = createFileRoute('/_public/auth/signup')({
  component: SignupPage,
});

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

const REGISTRATION_DEADLINE = new Date('2025-11-30T16:29:00Z');

function SignupPage() {
  const navigate = useNavigate();

  const isRegistrationClosed = new Date() >= REGISTRATION_DEADLINE;
  const { isAuthenticated } = useCurrentUser();
  const signupMutation = useSignUp();
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
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

  const onSubmit = async (data: SignupFormData) => {
    setError(null);
    try {
      await signupMutation.mutateAsync({
        email: data.email,
        password: data.password,
        name: data.fullname,
      });
      toast.success('Account created. Check your email for the code.');
      setRegisteredEmail(data.email);
      setRegistrationSuccess(true);
    } catch (err) {
      console.error('[Signup] Email signup failed:', err);
      setError((err as Error).message || 'Signup failed');
    }
  };

  if (isAuthenticated && !registrationSuccess) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isRegistrationClosed) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
        <div className="bg-white dark:bg-gray-900 w-full max-w-md p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Icon
                icon="mdi:clock-alert"
                className="text-3xl text-red-600 dark:text-red-400"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Registration Closed
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              The registration period for this hackathon has ended.
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Thank you for your interest! Registration closed on November 30,
              2025 at 23:29 WIB.
            </p>
            <Link to="/auth/login">
              <button className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors cursor-pointer">
                Go to Login
              </button>
            </Link>
            <button
              onClick={() => navigate({ to: '/' })}
              className="w-full py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Back to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <VerifyEmailOtp
        email={registeredEmail}
        onVerified={() => navigate({ to: '/onboarding/user' })}
        onBack={() => setRegistrationSuccess(false)}
        backLabel="Register with different email"
      />
    );
  }

  const inputBaseClass =
    'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed';
  const inputErrorClass = 'border-red-500 dark:border-red-500';
  const inputNormalClass = 'border-gray-300 dark:border-gray-600';

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate({ to: '/' })}
            className="cursor-pointer text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-base font-sans flex items-center"
          >
            <Icon icon="ic:baseline-chevron-left" width="24" height="24" />
            Back to Homepage
          </button>
          <ThemeToggle />
        </div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Join the hackathon community
          </p>
        </div>
        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="fullname"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Full Name
            </label>
            <input
              id="fullname"
              type="text"
              {...register('fullname')}
              placeholder="John Doe"
              disabled={signupMutation.isPending}
              className={`${inputBaseClass} ${errors.fullname ? inputErrorClass : inputNormalClass}`}
            />
            {errors.fullname && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                {errors.fullname.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="your@email.com"
              disabled={signupMutation.isPending}
              className={`${inputBaseClass} ${errors.email ? inputErrorClass : inputNormalClass}`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••"
                disabled={signupMutation.isPending}
                className={`${inputBaseClass} pr-12 ${errors.password ? inputErrorClass : inputNormalClass}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Icon
                  icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'}
                  className="text-xl"
                />
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="••••••••"
                disabled={signupMutation.isPending}
                className={`${inputBaseClass} pr-12 ${errors.confirmPassword ? inputErrorClass : inputNormalClass}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Icon
                  icon={showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'}
                  className="text-xl"
                />
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={!isValid || signupMutation.isPending}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {signupMutation.isPending
              ? 'Creating account...'
              : 'Create Account'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
        <div className="mt-6 text-center">
          <p className="text-gray-500 dark:text-gray-500 text-xs">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
