import type React from 'react';
import { type FC, useState, useEffect } from 'react';
import { Modal, InputField } from '@imphnen-frontend-service/ui/molecules';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { useProfile } from '../contexts/profile-context';
import { CameraOutlined } from '@ant-design/icons';

const DEFAULT_AVATAR = '/image/testimonial.webp';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  showNotification: (
    type: 'success' | 'error',
    title: string,
    message?: string
  ) => void;
}

export const EditProfileModal: FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  showNotification,
}) => {
  const { profileData, updateProfile, uploadAvatar, isUploadingAvatar } =
    useProfile();
  const [fullname, setFullname] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>(DEFAULT_AVATAR);
  const [isSaving, setIsSaving] = useState(false);
  const isUploading = isUploadingAvatar || isSaving;

  useEffect(() => {
    setFullname(profileData?.name ?? '');
    setPreviewUrl(profileData?.image || DEFAULT_AVATAR);
  }, [profileData]);

  const handleImageError = () => {
    setPreviewUrl(DEFAULT_AVATAR);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullname(e.target.value);
  };

  // The avatar is stored as soon as it is uploaded (profile.avatarUpload).
  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    try {
      await uploadAvatar(file);
    } catch (error) {
      showNotification(
        'error',
        'Upload Failed',
        (error instanceof Error && error.message) ||
          'Failed to upload avatar image'
      );
      setPreviewUrl(profileData?.image || DEFAULT_AVATAR);
    }
  };

  const handleSave = async () => {
    const name = fullname.trim();
    try {
      if (name !== '' && name !== profileData?.name) {
        setIsSaving(true);
        await updateProfile({ name });
        showNotification(
          'success',
          'Profile Updated',
          'Your profile has been successfully updated.'
        );
      }
      onClose();
    } catch (err: unknown) {
      showNotification(
        'error',
        'Failed to save changes',
        (err instanceof Error && err.message) || 'Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[90vh] max-w-[520px] overflow-y-auto rounded-2xl border-none bg-[#F6F6F6] p-5 sm:p-6"
    >
      <Modal.Header className="rounded-[6px] bg-[#DFECF7] px-4 py-2">
        <Modal.Title className="text-2xl font-semibold leading-8 text-[#4B4B4B]">
          Introduction
        </Modal.Title>
      </Modal.Header>
      <Modal.Content className="pt-8">
        {}
        <div className="flex justify-center pb-4">
          <div className="relative">
            {}
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="hidden"
              disabled={isUploading}
            />

            <label
              htmlFor="avatar-upload"
              className="cursor-pointer block relative group"
            >
              <img
                src={previewUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-lg transition-all duration-300 group-hover:border-blue-200"
                onError={handleImageError}
              />

              <div className="absolute inset-0 rounded-full bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Change Photo
                </span>
              </div>
            </label>

            {}
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border-2 border-white">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CameraOutlined className="text-xs" />
                )}
              </div>
            </label>
          </div>
        </div>
        <div className="space-y-6">
          {}
          <div className="space-y-2">
            <InputField
              label="Full Name"
              name="fullname"
              value={fullname}
              onChange={handleNameChange}
              placeholder="Enter your full name"
              className="w-full"
            />
            <p className="text-xs text-gray-500 pl-1">
              This name will be displayed on your profile
            </p>
          </div>
        </div>
      </Modal.Content>
      <Modal.Footer>
        <div className="flex w-full justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="h-10 w-[110px] rounded-[6px] text-sm"
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="h-10 w-[110px] rounded-[6px] text-sm"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
