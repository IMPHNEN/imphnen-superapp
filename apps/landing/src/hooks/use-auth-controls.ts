import {
  useCurrentUser,
  useSignOut,
} from '@imphnen-frontend-service/service/session';

type TAuthControls = {
  isAuthenticated: boolean;
  isSigningOut: boolean;
  signOut: () => void;
};

export const useAuthControls = (): TAuthControls => {
  const { isAuthenticated } = useCurrentUser();
  const signOutMutation = useSignOut();

  const signOut = (): void => {
    signOutMutation.mutate(undefined, {
      onSettled: (): void => {
        window.location.href = '/';
      },
    });
  };

  return {
    isAuthenticated,
    isSigningOut: signOutMutation.isPending,
    signOut,
  };
};
