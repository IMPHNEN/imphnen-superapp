import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  useSendVerificationOtp,
  useSignIn,
} from '@imphnen-frontend-service/service/session';
import { authClient } from '@imphnen-frontend-service/service/rpc';
import { errorMessage, loginFormSchema, type TLoginForm } from './auth-schemas';

const NOT_VERIFIED = /not verified/i;

export const useLogin = () => {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const sendOtp = useSendVerificationOtp();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TLoginForm>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setError(null);
    try {
      await signIn.mutateAsync(data);
      toast.success('Login successful!');
      await navigate({ to: '/dashboard' });
    } catch (err) {
      const message = errorMessage(err, 'Login failed');
      if (NOT_VERIFIED.test(message)) {
        sendOtp.mutate({ email: data.email });
        toast.info('Email belum terverifikasi. Kode OTP sudah dikirim ulang.');
        await navigate({
          to: '/auth/register/otp',
          search: { email: data.email },
        });
        return;
      }
      setError(message);
    }
  });

  return {
    form,
    onSubmit,
    error,
    setError,
    isLoading: signIn.isPending,
  };
};

export const useSocialLogin = () => {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async (): Promise<string | null> => {
    setIsLoading(true);
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${globalThis.location.origin}/dashboard`,
      errorCallbackURL: `${globalThis.location.origin}/auth/login`,
    });
    if (error) {
      setIsLoading(false);
      return error.message ?? 'Google login failed';
    }
    return null;
  };

  return { signInWithGoogle, isLoading };
};
