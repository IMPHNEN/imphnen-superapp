import { zodResolver } from '@hookform/resolvers/zod';
import { loginInputSchema, type TLoginInput } from '@app/schemas';
import { orpc } from '@imphnen-frontend-service/service/rpc';
import {
  useSignIn,
  useSignOut,
} from '@imphnen-frontend-service/service/session';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { firstAllowedPage, hasBackofficeAccess } from '../../../../libs/access';
import { errorMessage } from '../../../../libs/errors';

export const LOGIN_MESSAGE = {
  SUCCESS: 'Login berhasil!',
  FAILED: 'Login gagal',
  NO_ACCESS:
    'Akun ini tidak memiliki akses ke Backoffice. Hubungi admin jika ini keliru.',
} as const;

type TUseLogin = {
  form: UseFormReturn<TLoginInput>;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

export const useLogin = (): TUseLogin => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const signIn = useSignIn();
  const signOut = useSignOut();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TLoginInput>({
    resolver: zodResolver(loginInputSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (data): Promise<void> => {
    setError(null);
    try {
      await signIn.mutateAsync(data);
      const me = await queryClient.fetchQuery(orpc.me.get.queryOptions());
      const landing = firstAllowedPage(me.permissions);
      if (!hasBackofficeAccess(me.permissions) || !landing) {
        await signOut.mutateAsync();
        setError(LOGIN_MESSAGE.NO_ACCESS);
        return;
      }
      toast.success(LOGIN_MESSAGE.SUCCESS);
      navigate({ to: landing });
    } catch (err) {
      setError(errorMessage(err, LOGIN_MESSAGE.FAILED));
    }
  });

  return {
    form,
    onSubmit,
    isLoading: signIn.isPending || signOut.isPending,
    error,
  };
};
