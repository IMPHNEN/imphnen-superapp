import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  client,
  orpc,
  type TClientInputs,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';

export type TMentorApplication = NonNullable<TClientOutputs['mentor']['me']>;
export type TMentorRegisterInput = TClientInputs['mentor']['register'];

export const MENTOR_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  INACTIVE: 'inactive',
} as const satisfies Record<string, TMentorApplication['status']>;

/** The signed-in user's mentor application (`null` when there is none). */
export const useMyMentorApplication = () =>
  useQuery(orpc.mentor.me.queryOptions());

type TApplyInput = {
  profile: TMentorRegisterInput;
  cv: File | null;
  identity: File;
};

/**
 * Submits (or resubmits) the application, then uploads the documents. The
 * identity document is required for approval; the CV is optional.
 */
export const useApplyAsMentor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ profile, cv, identity }: TApplyInput) => {
      await client.mentor.register(profile);
      await client.mentor.documentUpload({ kind: 'identity', file: identity });
      if (cv) {
        return client.mentor.documentUpload({ kind: 'cv', file: cv });
      }
      return client.mentor.me();
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: orpc.mentor.key() }),
  });
};

/** Uploads (or replaces) one application document: `cv` or `identity`. */
export const useUploadMentorDocument = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.mentor.documentUpload.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: orpc.mentor.key() }),
    })
  );
};
