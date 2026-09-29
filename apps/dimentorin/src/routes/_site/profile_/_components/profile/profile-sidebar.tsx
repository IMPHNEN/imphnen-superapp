import { type FC, useState } from 'react';
import { NativeSelect as Select } from '@imphnen-frontend-service/ui/atoms';
import { SectionWrapper } from '../shared/section-wrapper';
import type { NotificationType } from '../modals/notification-modal';
import { PersonalInfoSection } from '../sections/personal-info-section';
import { SkillsSection } from '../sections/skills-section';
import { type TProfileUpdate, useProfile } from '../contexts/profile-context';

interface ProfileSidebarProps {
  showNotification: (
    type: NotificationType['type'],
    title: string,
    message?: string
  ) => void;
  isViewOnly?: boolean;
}

const CAREER_STATUS_PLACEHOLDER = 'Career Status';
const CAREER_STATUSES = [
  'Student',
  'Fresh Graduate',
  'Junior Developer',
  'Senior Developer',
  'Team Lead',
  'Freelancer',
];

export const ProfileSidebar: FC<ProfileSidebarProps> = ({
  showNotification,
  isViewOnly = false,
}) => {
  const { profileData, updateProfile, isUpdating } = useProfile();
  const [isUpdatingCareerStatus, setIsUpdatingCareerStatus] = useState(false);

  const careerStatus = profileData?.careerStatus || CAREER_STATUS_PLACEHOLDER;
  const personalInfo = {
    email: profileData?.email || 'email@example.com',
    phone: profileData?.phone || '+62 (88) 8888 8888',
    location: profileData?.location || 'Location',
  };
  const skills = profileData?.skills ?? [];

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
    } catch (err) {
      showNotification(
        'error',
        'Gagal menyimpan perubahan',
        (err instanceof Error && err.message) || 'Silakan coba lagi'
      );
    }
  };

  const hasCustomStatus =
    careerStatus !== CAREER_STATUS_PLACEHOLDER &&
    !CAREER_STATUSES.includes(careerStatus);

  return (
    <div className="space-y-6">
      <SectionWrapper title="Career Status">
        <Select
          value={careerStatus}
          onChange={async (e) => {
            if (isUpdatingCareerStatus) return;
            const newStatus = e.target.value;
            setIsUpdatingCareerStatus(true);
            try {
              await handleProfileUpdate({
                extension: {
                  careerStatus:
                    newStatus === CAREER_STATUS_PLACEHOLDER ? null : newStatus,
                },
              });
            } finally {
              setIsUpdatingCareerStatus(false);
            }
          }}
          className="w-full min-w-[200px]"
          disabled={isUpdatingCareerStatus || isViewOnly}
        >
          <option value={CAREER_STATUS_PLACEHOLDER}>
            {CAREER_STATUS_PLACEHOLDER}
          </option>
          {hasCustomStatus && (
            <option value={careerStatus}>{careerStatus}</option>
          )}
          {CAREER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </SectionWrapper>

      <PersonalInfoSection
        initialContactInfo={personalInfo}
        onSave={async (newPersonalInfo) => {
          await handleProfileUpdate({
            extension: {
              phoneForVerification: newPersonalInfo.phone || null,
              domicile: newPersonalInfo.location || null,
            },
          });
        }}
        showNotification={showNotification}
        isLoading={isUpdating}
        isViewOnly={isViewOnly}
      />

      <SkillsSection
        initialSkills={skills}
        onSave={async (newSkills) => {
          await handleProfileUpdate({ extension: { skills: newSkills } });
        }}
        showNotification={showNotification}
        isLoading={isUpdating}
        isViewOnly={isViewOnly}
      />
    </div>
  );
};
