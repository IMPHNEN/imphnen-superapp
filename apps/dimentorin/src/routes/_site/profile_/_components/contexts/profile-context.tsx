import type React from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import {
  type TEducationItem,
  type TExperienceItem,
  type TMentorPublicProfile,
  type TProfile,
  type TProfileUpdate,
  useMentorProfileByUser,
  useOwnMentorApplication,
  useOwnProfile,
  useUpdateOwnProfile,
  useUploadMentorCv,
  useUploadOwnAvatar,
} from '../../_hooks/use-profile-data';

/**
 * What the profile page renders, whichever source it comes from: the own
 * profile (`profile.get`) or another member's public mentor profile
 * (`mentor.getByUser`).
 */
export type TProfileView = {
  name: string;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
  bio: string;
  currentRole: string;
  birthdate: string;
  gender: string;
  phone: string;
  location: string;
  careerStatus: string;
  skills: string[];
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  twitterUrl: string;
  cvUrl: string;
  experience: TExperienceItem[];
  education: TEducationItem[];
  completedSessionCount: number | null;
  ratingAverage: number | null;
};

const fromOwnProfile = (profile: TProfile): TProfileView => {
  const ext = profile.extension;
  return {
    name: profile.name,
    email: profile.email,
    image: profile.image,
    role: profile.role,
    createdAt: profile.createdAt,
    bio: ext.bio ?? '',
    currentRole: '',
    birthdate: ext.birthdate ?? '',
    gender: ext.gender ?? '',
    phone: ext.phoneForVerification ?? ext.phoneNumber ?? '',
    location: ext.domicile ?? ext.location ?? '',
    careerStatus: ext.careerStatus ?? '',
    skills: ext.skills,
    linkedinUrl: ext.linkedinUrl ?? '',
    githubUrl: ext.githubUrl ?? '',
    portfolioUrl: ext.portfolioUrl ?? ext.websiteUrl ?? '',
    twitterUrl: ext.twitterUrl ?? '',
    cvUrl: ext.cvUrl ?? '',
    experience: ext.experience,
    education: ext.education,
    completedSessionCount: null,
    ratingAverage: null,
  };
};

const fromMentorProfile = (mentor: TMentorPublicProfile): TProfileView => ({
  name: mentor.name,
  email: '',
  image: mentor.image,
  role: mentor.currentRole ?? 'Mentor',
  createdAt: mentor.createdAt,
  bio: mentor.bio ?? '',
  currentRole: mentor.currentRole ?? '',
  birthdate: '',
  gender: '',
  phone: '',
  location: mentor.location ?? '',
  careerStatus: mentor.availabilityCommitment ?? '',
  skills: mentor.expertise,
  linkedinUrl: mentor.linkedinUrl ?? '',
  githubUrl: mentor.githubUrl ?? '',
  portfolioUrl: mentor.portfolioUrl ?? '',
  twitterUrl: mentor.twitterUrl ?? '',
  cvUrl: '',
  experience: [],
  education: [],
  completedSessionCount: mentor.completedSessionCount,
  ratingAverage: mentor.ratingAverage,
});

interface ProfileContextType {
  profileData: TProfileView | undefined;
  isLoading: boolean;
  error: unknown;
  isOwnProfile: boolean;
  profileId: string | null;
  profileType: 'user' | 'mentor';
  updateProfile: (data: TProfileUpdate) => Promise<void>;
  isUpdating: boolean;
  uploadAvatar: (file: File) => Promise<void>;
  isUploadingAvatar: boolean;
  /** CV upload goes to the mentor application; `false` without one. */
  canUploadCv: boolean;
  hasUploadedCv: boolean;
  uploadCv: (file: File) => Promise<void>;
  isUploadingCv: boolean;
  canAccessMentor: boolean;
}
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
  children: React.ReactNode;
  profileId?: string;
  profileType?: 'user' | 'mentor';
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({
  children,
  profileId,
}) => {
  const { can } = useCurrentUser();
  const isOwnProfile = !profileId;

  const ownQuery = useOwnProfile(isOwnProfile);
  const mentorQuery = useMentorProfileByUser(profileId);
  const applicationQuery = useOwnMentorApplication(isOwnProfile);
  const updateMutation = useUpdateOwnProfile();
  const avatarMutation = useUploadOwnAvatar();
  const cvMutation = useUploadMentorCv();

  const selectedQuery = isOwnProfile ? ownQuery : mentorQuery;

  const profileData = useMemo<TProfileView | undefined>(() => {
    if (isOwnProfile) {
      return ownQuery.data ? fromOwnProfile(ownQuery.data) : undefined;
    }
    return mentorQuery.data ? fromMentorProfile(mentorQuery.data) : undefined;
  }, [isOwnProfile, ownQuery.data, mentorQuery.data]);

  const { mutateAsync: updateAsync } = updateMutation;
  const { mutateAsync: avatarAsync } = avatarMutation;
  const { mutateAsync: cvAsync } = cvMutation;

  const updateProfile = useCallback(
    async (data: TProfileUpdate): Promise<void> => {
      if (!isOwnProfile) throw new Error('Profil ini hanya bisa dilihat.');
      await updateAsync(data);
    },
    [isOwnProfile, updateAsync]
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<void> => {
      await avatarAsync({ file });
    },
    [avatarAsync]
  );

  const uploadCv = useCallback(
    async (file: File): Promise<void> => {
      await cvAsync({ kind: 'cv', file });
    },
    [cvAsync]
  );

  const application = applicationQuery.data ?? null;

  const value: ProfileContextType = {
    profileData,
    isLoading: selectedQuery.isLoading,
    error: selectedQuery.error,
    isOwnProfile,
    profileId: profileId ?? null,
    profileType: isOwnProfile ? 'user' : 'mentor',
    updateProfile,
    isUpdating: updateMutation.isPending,
    uploadAvatar,
    isUploadingAvatar: avatarMutation.isPending,
    canUploadCv: isOwnProfile && application !== null,
    hasUploadedCv: application?.hasCv ?? false,
    uploadCv,
    isUploadingCv: cvMutation.isPending,
    canAccessMentor: can('mentor-profile:read'),
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export type { ProfileContextType, TProfileUpdate };
