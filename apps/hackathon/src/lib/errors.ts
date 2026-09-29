import { toast } from 'sonner';

export const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

export const toastError = (error: unknown, fallback: string): void => {
  toast.error(errorMessage(error, fallback));
};
