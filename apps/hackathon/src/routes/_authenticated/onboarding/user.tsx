import { type FC, type ReactElement, useState, useEffect } from 'react';
import { ControlledInputField } from '@imphnen-frontend-service/ui/organisms';
import { Button, Textarea } from '@imphnen-frontend-service/ui/atoms';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm, Controller } from 'react-hook-form';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import {
  useParticipantMe,
  useProfileSave,
} from '../../../hooks/use-participant';
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  profileSchema,
  type TProfileForm,
} from '../../../lib/forms';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { CitySelect } from '../../../components/city-select';
import { Icon } from '@iconify/react';

const ROLE_OPTIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'UI/UX Designer',
  'Product Manager',
  'Data Scientist',
  'Mobile Developer',
];

const UserOnboardingPage: FC = (): ReactElement => {
  const navigate = useNavigate();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const { me } = useCurrentUser();
  const { data: participant } = useParticipantMe();
  const { mutateAsync: saveProfile, isPending: isSaving } = useProfileSave();

  const form = useForm<TProfileForm>({
    resolver: zodResolver(profileSchema),
    mode: 'all',
    defaultValues: {
      fullname: me?.user.name || '',
      location: participant?.location || '',
      bio: participant?.bio || '',
      skills: participant?.skills || [],
    },
  });

  useEffect(() => {
    if (me?.user.image && !avatarPreview) {
      setAvatarPreview(me.user.image);
    }
  }, [me?.user.image, avatarPreview]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > AVATAR_MAX_BYTES) {
        toast.error('The file is too large. Maximum size is 5MB.');
        e.target.value = '';
        return;
      }

      if (!AVATAR_TYPES.includes(file.type)) {
        toast.error('The file must be a JPG, PNG or WebP image');
        e.target.value = '';
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await saveProfile({
        name: data.fullname,
        avatar: avatarFile,
        participant: {
          location: data.location,
          bio: data.bio || null,
          skills: data.skills ?? [],
        },
      });

      navigate({ to: '/dashboard' });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Onboarding failed. Please try again.'
      );
    }
  });

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl p-8 rounded-xl shadow-lg dark:shadow-gray-950/50">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 font-sans dark:text-gray-400">
            Tell us more about yourself to get started
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Icon
                    icon="ic:baseline-person"
                    width="48"
                    height="48"
                    className="text-gray-400 dark:text-gray-500"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center">
              <label htmlFor="avatar" className="cursor-pointer">
                <span className="px-4 py-2 bg-primary-500 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-600 dark:hover:bg-primary-700 inline-block">
                  {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                </span>
                <input
                  id="avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
                Optional, but highly recommended. Max 5MB
              </p>
            </div>
          </div>

          <ControlledInputField
            control={form.control}
            label="Full Name"
            placeholder="Enter your full name"
            name="fullname"
            className="px-3 py-2 text-label2 rounded-lg max-h-auto text-base"
            size="md"
            isRequired={true}
          />

          <div className="space-y-2">
            <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
              City <span className="text-red-500">*</span>
            </label>
            <Controller
              control={form.control}
              name="location"
              render={({ field, fieldState }) => (
                <CitySelect
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Search your city..."
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
              Role / Skills
            </label>
            <Controller
              control={form.control}
              name="skills"
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {ROLE_OPTIONS.map((role) => (
                      <label
                        key={role}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={field.value?.includes(role)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...(field.value || []), role]
                              : (field.value || []).filter((v) => v !== role);
                            field.onChange(newValue);
                          }}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-primary-500 focus:ring-blue-500 dark:focus:ring-primary-500 dark:bg-gray-800"
                        />
                        <span className="text-sm dark:text-gray-300">
                          {role}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
              Bio{' '}
              <span className="text-gray-400 dark:text-gray-500">
                (Optional)
              </span>
            </label>
            <Controller
              control={form.control}
              name="bio"
              render={({ field, fieldState }) => (
                <div className="flex">
                  <Textarea
                    {...field}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full rounded-lg text-sm"
                    style={{ resize: 'vertical' }}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          <Button
            className="w-full"
            type="submit"
            disabled={!form.formState.isValid || isSaving}
          >
            {isSaving ? 'Saving...' : 'Complete Setup'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/_authenticated/onboarding/user')({
  component: UserOnboardingPage,
});
