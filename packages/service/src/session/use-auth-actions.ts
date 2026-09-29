'use client';

import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { authClient } from '../rpc/auth-client';
import { SESSION_QUERY_KEY } from './session-keys';

type TAuthResult<TData> = {
  data: TData | null;
  error: { message?: string; code?: string } | null;
};

const unwrap = async <TData>(
  result: Promise<TAuthResult<TData>>
): Promise<TData> => {
  const { data, error } = await result;
  if (error) throw new Error(error.message ?? error.code ?? 'Request failed');
  return data as TData;
};

export type TSignInInput = { email: string; password: string };
export type TSignUpInput = { email: string; password: string; name: string };
export type TEmailOtpInput = { email: string; otp: string };
export type TEmailInput = { email: string };
export type TPasswordResetInput = { token: string; newPassword: string };
export type TPasswordForgotInput = { email: string; redirectTo: string };

const useSessionRefresh = (): (() => Promise<void>) => {
  const queryClient = useQueryClient();
  return (): Promise<void> =>
    queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
};

export const useSignIn = (): UseMutationResult<
  unknown,
  Error,
  TSignInInput
> => {
  const refresh = useSessionRefresh();
  return useMutation({
    mutationFn: (input: TSignInInput): Promise<unknown> =>
      unwrap(authClient.signIn.email(input)),
    onSuccess: refresh,
  });
};

export const useSignUp = (): UseMutationResult<unknown, Error, TSignUpInput> =>
  useMutation({
    mutationFn: (input: TSignUpInput): Promise<unknown> =>
      unwrap(authClient.signUp.email(input)),
  });

export const useSendVerificationOtp = (): UseMutationResult<
  unknown,
  Error,
  TEmailInput
> =>
  useMutation({
    mutationFn: (input: TEmailInput): Promise<unknown> =>
      unwrap(
        authClient.emailOtp.sendVerificationOtp({
          email: input.email,
          type: 'email-verification',
        })
      ),
  });

export const useVerifyEmailOtp = (): UseMutationResult<
  unknown,
  Error,
  TEmailOtpInput
> => {
  const refresh = useSessionRefresh();
  return useMutation({
    mutationFn: (input: TEmailOtpInput): Promise<unknown> =>
      unwrap(authClient.emailOtp.verifyEmail(input)),
    onSuccess: refresh,
  });
};

export const useForgotPassword = (): UseMutationResult<
  unknown,
  Error,
  TPasswordForgotInput
> =>
  useMutation({
    mutationFn: (input: TPasswordForgotInput): Promise<unknown> =>
      unwrap(authClient.requestPasswordReset(input)),
  });

export const useResetPassword = (): UseMutationResult<
  unknown,
  Error,
  TPasswordResetInput
> =>
  useMutation({
    mutationFn: (input: TPasswordResetInput): Promise<unknown> =>
      unwrap(authClient.resetPassword(input)),
  });

export const useSignOut = (): UseMutationResult<unknown, Error, void> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (): Promise<unknown> => unwrap(authClient.signOut()),
    onSuccess: (): void => {
      queryClient.clear();
    },
  });
};
