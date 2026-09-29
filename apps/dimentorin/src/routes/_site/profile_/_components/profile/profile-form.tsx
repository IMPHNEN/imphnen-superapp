import type { FC } from 'react';
import { ExperiencesSection } from '../sections/experiences-section';
import { CvResumeSection } from '../sections/cv-resume-section';
import { DescriptionSection } from '../sections/description-section';
import { EducationSection } from '../sections/education-section';
import { type TProfileUpdate, useProfile } from '../contexts/profile-context';

interface ProfileFormProps {
  showNotification: (
    type: 'success' | 'error',
    title: string,
    message?: string
  ) => void;
  isViewOnly?: boolean;
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : '';

export const ProfileForm: FC<ProfileFormProps> = ({
  showNotification,
  isViewOnly = false,
}) => {
  const {
    profileData,
    updateProfile,
    isUpdating,
    canUploadCv,
    hasUploadedCv,
    uploadCv,
    isUploadingCv,
  } = useProfile();

  const handleProfileUpdate = async (updates: TProfileUpdate) => {
    if (isViewOnly) {
      showNotification(
        'error',
        'Akses Ditolak',
        'Anda tidak memiliki izin untuk mengedit profil ini.'
      );
      return;
    }
    try {
      await updateProfile(updates);
      showNotification('success', 'Perubahan Berhasil Disimpan');
    } catch (err: unknown) {
      showNotification(
        'error',
        'Gagal menyimpan perubahan',
        errorMessage(err) || 'Silakan coba lagi'
      );
      throw err;
    }
  };

  const handleCvUpload = async (file: File) => {
    try {
      await uploadCv(file);
      showNotification('success', 'CV Berhasil Diunggah');
    } catch (err: unknown) {
      showNotification(
        'error',
        'Gagal mengunggah CV',
        errorMessage(err) || 'Silakan coba lagi'
      );
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <DescriptionSection
        initialDescription={profileData?.bio ?? ''}
        onSave={async (newDescription) => {
          await handleProfileUpdate({
            extension: { bio: newDescription || null },
          });
        }}
        showNotification={showNotification}
        isLoading={isUpdating}
        isViewOnly={isViewOnly}
      />
      <CvResumeSection
        cvUrl={profileData?.cvUrl ?? ''}
        hasUploadedCv={hasUploadedCv}
        fullname={profileData?.name ?? ''}
        onUpload={handleCvUpload}
        showNotification={showNotification}
        isLoading={isUploadingCv}
        isViewOnly={isViewOnly || !canUploadCv}
      />
      <ExperiencesSection
        initialExperiences={profileData?.experience ?? []}
        onSave={async (newExperiences) => {
          try {
            await handleProfileUpdate({
              extension: { experience: newExperiences },
            });
          } catch (error) {
            console.error('Experience update error:', error);
          }
        }}
        showNotification={showNotification}
        isLoading={isUpdating}
        isViewOnly={isViewOnly}
      />
      <EducationSection
        initialEducation={profileData?.education ?? []}
        onSave={async (newEducations) => {
          try {
            await handleProfileUpdate({
              extension: { education: newEducations },
            });
          } catch (error) {
            console.error('Education update error:', error);
          }
        }}
        showNotification={showNotification}
        isLoading={isUpdating}
        isViewOnly={isViewOnly}
      />
    </div>
  );
};
