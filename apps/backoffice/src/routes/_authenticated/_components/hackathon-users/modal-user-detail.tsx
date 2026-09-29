import { type FC, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PERMISSION } from '@app/permissions';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { cn } from '@imphnen-frontend-service/utils';
import {
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  SaveOutlined,
  CloseOutlined,
  ExclamationOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { errorMessage } from '../../../../libs/errors';
import {
  type THackathonParticipant,
  useHackathonParticipant,
} from '../../_hooks/use-hackathon';
import {
  useUser,
  useUserRemove,
  useUserSetActive,
  useUserUpdate,
} from '../../_hooks/use-users';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: THackathonParticipant | null;
}

const formatLongDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const ModalUserDetail: FC<ModalProps> = ({ isOpen, onClose, user }) => {
  const { me, can } = useCurrentUser();
  const [name, setName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const userId = isOpen && user ? user.userId : undefined;
  const isSelf = me?.user.id === userId;

  const { data: profile } = useHackathonParticipant(userId);
  const { data: account } = useUser(
    can(PERMISSION.USER_READ) ? userId : undefined
  );
  const updateUser = useUserUpdate();
  const setActive = useUserSetActive();
  const removeUser = useUserRemove();

  useEffect(() => {
    if (isOpen && user) setName(user.name);
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const trimmedName = name.trim();
  const canSave =
    can(PERMISSION.USER_UPDATE) &&
    trimmedName !== '' &&
    trimmedName !== user.name &&
    !updateUser.isPending;

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync({ id: user.userId, name: trimmedName });
      toast.success('Nama pengguna diperbarui');
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'Perubahan gagal disimpan'));
    }
  };

  const handleSetActive = async (isActive: boolean) => {
    if (!account || account.isActive === isActive) return;
    try {
      await setActive.mutateAsync({ id: user.userId, isActive });
      toast.success(isActive ? 'Akun diaktifkan' : 'Akun dinonaktifkan');
    } catch (error) {
      toast.error(errorMessage(error, 'Status akun gagal diubah'));
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await removeUser.mutateAsync({ id: user.userId });
      toast.success('Akun dihapus');
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'Akun gagal dihapus'));
    }
  };

  const skills = profile?.skills ?? [];
  const canToggleActive = !!account && can(PERMISSION.USER_ACTIVATE) && !isSelf;
  const isActive = account?.isActive ?? true;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="border-b border-neutral-200 px-8 py-6 flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserOutlined className="text-neutral-500 text-2xl" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                  Edit User Profile
                </h2>
                <div className="text-sm text-neutral-500">
                  Profil hackathon diisi oleh peserta; admin dapat mengubah nama
                  dan status akun.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              onClick={onClose}
            >
              <CloseOutlined className="text-neutral-400 text-lg" />
            </button>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <UserOutlined className="text-neutral-400" />
                      <div className="flex-1">
                        <label
                          htmlFor="participant-name"
                          className="text-sm text-neutral-500 block mb-1"
                        >
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="participant-name"
                          type="text"
                          value={name}
                          disabled={!can(PERMISSION.USER_UPDATE)}
                          onChange={(e) => setName(e.target.value)}
                          className={cn(
                            'w-full border rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:outline-none',
                            trimmedName === ''
                              ? 'border-red-300 bg-red-50'
                              : 'border-neutral-300'
                          )}
                          placeholder="Enter full name"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MailOutlined className="text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <PhoneOutlined className="text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500">Phone</p>
                        <p className="font-medium">{user.phoneNumber ?? '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <EnvironmentOutlined className="text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500">Location</p>
                        <p className="font-medium">{user.location ?? '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarOutlined className="text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500">Joined Date</p>
                        <p className="font-medium">
                          {formatLongDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                    Bio
                  </h3>
                  <p className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-700 min-h-24 whitespace-pre-wrap">
                    {profile?.bio || '-'}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {account && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                      Account Status
                    </h3>
                    <div className="flex bg-neutral-100 p-1 rounded-lg">
                      <button
                        type="button"
                        disabled={!canToggleActive || setActive.isPending}
                        onClick={() => handleSetActive(true)}
                        className={cn(
                          'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer disabled:cursor-not-allowed',
                          isActive
                            ? 'bg-white text-success-700 shadow-sm ring-1 ring-success-200'
                            : 'text-neutral-600 hover:text-neutral-800'
                        )}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              isActive ? 'bg-success-500' : 'bg-neutral-400'
                            )}
                          />
                          Active
                        </div>
                      </button>
                      <button
                        type="button"
                        disabled={!canToggleActive || setActive.isPending}
                        onClick={() => handleSetActive(false)}
                        className={cn(
                          'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer disabled:cursor-not-allowed',
                          !isActive
                            ? 'bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200'
                            : 'text-neutral-600 hover:text-neutral-800'
                        )}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              !isActive ? 'bg-neutral-500' : 'bg-neutral-400'
                            )}
                          />
                          Inactive
                        </div>
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      {isActive
                        ? 'User can access their account and participate in activities'
                        : 'User account is suspended and cannot access services'}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    Skills & Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2 min-h-10 p-3 border border-neutral-300 rounded-lg bg-neutral-50">
                    {skills.length > 0 ? (
                      skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-neutral-400 text-sm">
                        No skills added yet
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    Account Details
                  </h3>
                  <div className="space-y-3 bg-neutral-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-neutral-600 text-sm">User ID</span>
                      <span className="font-mono text-sm text-neutral-800">
                        {user.userId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-neutral-600 text-sm">Team</span>
                      <span className="text-sm text-neutral-800">
                        {user.team?.name ?? '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {can(PERMISSION.USER_DELETE) && !isSelf && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors cursor-pointer"
                  >
                    Delete Account
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={!canSave}
                  className={cn(
                    'flex items-center gap-2 px-6',
                    !canSave && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <SaveOutlined className="text-sm" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="fixed inset-0 z-60">
              <div
                className="fixed inset-0 bg-black/50"
                onClick={() => setShowDeleteConfirm(false)}
                aria-hidden="true"
              />
              <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto bg-white rounded-xl shadow-2xl w-full max-w-md">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <ExclamationOutlined className="text-red-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900">
                          Delete Account
                        </h3>
                        <p className="text-sm text-neutral-500">
                          The account is deactivated and hidden
                        </p>
                      </div>
                    </div>
                    <p className="text-neutral-700 mb-6">
                      Are you sure you want to delete{' '}
                      <strong>{user.name}</strong>'s account? A team they lead
                      is deleted with it.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteAccount}
                        disabled={removeUser.isPending}
                        className="px-4"
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalUserDetail;
