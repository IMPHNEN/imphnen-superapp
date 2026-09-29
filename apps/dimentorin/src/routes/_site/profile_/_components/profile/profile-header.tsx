import type { FC } from 'react';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { EditOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useProfile } from '../contexts/profile-context';

interface ProfileHeaderProps {
  onEditProfileClick: () => void;
  isViewOnly?: boolean;
}

export const ProfileHeader: FC<ProfileHeaderProps> = ({
  onEditProfileClick,
  isViewOnly = false,
}) => {
  const { profileData, profileType } = useProfile();

  const avatarSrc = profileData?.image || '/image/testimonial.webp';
  const displayFullname = profileData?.name || 'User Name';
  const role = profileData?.currentRole || profileData?.role || 'Role';
  const displayJob = role.charAt(0).toUpperCase() + role.slice(1);

  const joinDate = profileData
    ? new Date(profileData.createdAt).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
      })
    : '';

  return (
    <motion.div
      className="bg-white rounded-lg p-6 md:p-8 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center">
            <img
              src={avatarSrc}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-neutral-800 mb-2">
                {displayFullname}
              </h1>
              <p className="text-neutral-600 mb-1">{displayJob}</p>
              {}
              <p className="text-sm text-neutral-500 mt-2">
                Bergabung sejak {joinDate}
              </p>
            </div>

            {!isViewOnly && (
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-2 self-start"
                onClick={onEditProfileClick}
              >
                <EditOutlined className="text-sm" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {profileType === 'mentor' && (
        <div className="flex justify-around md:justify-start md:gap-12 mt-6 pt-6 border-t border-neutral-100">
          <div className="text-center md:text-left">
            <p className="text-lg md:text-xl font-semibold text-primary-500">
              {profileData?.completedSessionCount ?? 'N/A'}
            </p>
            <p className="text-xs md:text-sm text-neutral-600">
              Mentoring Sessions
            </p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-lg md:text-xl font-semibold text-primary-500">
              {profileData?.ratingAverage?.toFixed(1) ?? 'N/A'}
            </p>
            <p className="text-xs md:text-sm text-neutral-600">Rating</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-lg md:text-xl font-semibold text-primary-500">
              0
            </p>
            <p className="text-xs md:text-sm text-neutral-600">Certificates</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
