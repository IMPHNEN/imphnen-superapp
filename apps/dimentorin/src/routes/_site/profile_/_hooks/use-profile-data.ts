import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  orpc,
  type TClientInputs,
  type TClientOutputs,
} from '@imphnen-frontend-service/service/rpc';
import { SESSION_QUERY_KEY } from '@imphnen-frontend-service/service/session';

export type TProfile = TClientOutputs['profile']['get'];
export type TProfileUpdate = TClientInputs['profile']['update'];
export type TProfileExtensionPatch = NonNullable<TProfileUpdate['extension']>;
export type TMentorPublicProfile = TClientOutputs['mentor']['getByUser'];
export type TExperienceItem = TProfile['extension']['experience'][number];
export type TEducationItem = TProfile['extension']['education'][number];

/** The signed-in user's own profile. */
export const useOwnProfile = (enabled: boolean) =>
  useQuery({ ...orpc.profile.get.queryOptions(), enabled });

/** Another member's public profile: only mentors have one. */
export const useMentorProfileByUser = (userId: string | undefined) =>
  useQuery({
    ...orpc.mentor.getByUser.queryOptions({ input: { userId: userId ?? '' } }),
    enabled: Boolean(userId),
  });

/** The signed-in user's mentor application, used for the CV document. */
export const useOwnMentorApplication = (enabled: boolean) =>
  useQuery({ ...orpc.mentor.me.queryOptions(), enabled });

const useRefreshProfile = () => {
  const queryClient = useQueryClient();
  return async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: orpc.profile.key() }),
      // name and image are part of the session user as well
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
    ]);
  };
};

export const useUpdateOwnProfile = () => {
  const refresh = useRefreshProfile();
  return useMutation(
    orpc.profile.update.mutationOptions({ onSuccess: refresh })
  );
};

export const useUploadOwnAvatar = () => {
  const refresh = useRefreshProfile();
  return useMutation(
    orpc.profile.avatarUpload.mutationOptions({ onSuccess: refresh })
  );
};

export const useUploadMentorCv = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.mentor.documentUpload.mutationOptions(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: orpc.mentor.key() }),
  });
};
