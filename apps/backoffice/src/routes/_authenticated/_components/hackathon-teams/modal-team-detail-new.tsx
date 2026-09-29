import { type FC, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { HACKATHON_LIMIT } from '@app/schemas';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import TeamBannerPlaceholder from './team-banner-placeholder';
import {
  TeamOutlined,
  CloseOutlined,
  DeleteOutlined,
  CalendarOutlined,
  CrownOutlined,
  ExclamationOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { errorMessage } from '../../../../libs/errors';
import {
  type THackathonTeam,
  useHackathonTeam,
  useHackathonTeamRemove,
  useHackathonWinnerList,
  useHackathonWinnerRemove,
  useHackathonWinnerSet,
} from '../../_hooks/use-hackathon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: THackathonTeam | null;
}

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const readOnlyFieldClass =
  'w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-neutral-50 text-neutral-700';

const ModalTeamDetail: FC<ModalProps> = ({ isOpen, onClose, team }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rank, setRank] = useState(1);
  const [prize, setPrize] = useState('');
  const teamId = isOpen && team ? team.id : undefined;

  const { data: detail } = useHackathonTeam(teamId);
  const { data: winners } = useHackathonWinnerList();
  const removeTeam = useHackathonTeamRemove();
  const setWinner = useHackathonWinnerSet();
  const removeWinner = useHackathonWinnerRemove();

  const winner = winners?.items.find((item) => item.team.id === teamId);

  useEffect(() => {
    setRank(winner?.rank ?? 1);
    setPrize(winner?.prize ?? '');
  }, [winner, teamId]);

  if (!isOpen || !team) return null;

  const handleDelete = async () => {
    try {
      await removeTeam.mutateAsync({ id: team.id });
      toast.success('Team dihapus');
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'Team gagal dihapus'));
    }
  };

  const handleSetWinner = async () => {
    try {
      await setWinner.mutateAsync({
        teamId: team.id,
        rank,
        prize: prize.trim() || null,
      });
      toast.success('Pemenang disimpan');
    } catch (error) {
      toast.error(errorMessage(error, 'Pemenang gagal disimpan'));
    }
  };

  const handleRemoveWinner = async () => {
    try {
      await removeWinner.mutateAsync({ teamId: team.id });
      toast.success('Status pemenang dihapus');
    } catch (error) {
      toast.error(errorMessage(error, 'Status pemenang gagal dihapus'));
    }
  };

  const members = detail?.members ?? [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <TeamOutlined className="text-primary-600 text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Team Details
              </h2>
              <p className="text-sm text-neutral-500">
                View team information, members and winner status
              </p>
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

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <span className="block text-sm font-medium text-neutral-700">
              Team Banner
            </span>
            <TeamBannerPlaceholder
              banner={team.bannerUrl ?? undefined}
              teamName={team.name}
              className="rounded-lg border border-neutral-200"
            />
          </div>

          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-2">
              <span className="block text-sm font-medium text-neutral-700 mb-2">
                Logo
              </span>
              <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border border-neutral-200">
                {team.logoUrl ? (
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <TeamOutlined className="text-neutral-400 text-xl" />
                )}
              </div>
            </div>

            <div className="col-span-10 space-y-2">
              <span className="block text-sm font-medium text-neutral-700">
                Team Name
              </span>
              <p className={readOnlyFieldClass}>{team.name}</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-neutral-700">
              Description
            </span>
            <p className={`${readOnlyFieldClass} whitespace-pre-wrap min-h-16`}>
              {team.description || '-'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="block text-sm font-medium text-neutral-700">
                City
              </span>
              <p className={readOnlyFieldClass}>{team.city}</p>
            </div>
            <div className="space-y-2">
              <span className="block text-sm font-medium text-neutral-700">
                Team Visibility
              </span>
              <p
                className={`${readOnlyFieldClass} flex items-center gap-2 capitalize`}
              >
                {team.visibility === 'public' ? (
                  <EyeOutlined className="text-info-600" />
                ) : (
                  <EyeInvisibleOutlined className="text-neutral-600" />
                )}
                {team.visibility}
              </p>
            </div>
          </div>

          <div className="space-y-4 border-t border-neutral-200 pt-4">
            <div className="space-y-2">
              <span className="block text-sm font-medium text-neutral-700">
                Members ({team.memberCount}/{HACKATHON_LIMIT.TEAM_MAX_MEMBERS})
              </span>
              <div className="divide-y divide-neutral-100 rounded-lg bg-neutral-50">
                {members.length === 0 ? (
                  <div className="p-3 flex items-center gap-3">
                    <CrownOutlined className="text-yellow-600 text-lg" />
                    <span className="text-sm text-neutral-700">
                      {team.leader.name}
                    </span>
                  </div>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.user.id}
                      className="p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {member.role === 'leader' ? (
                          <CrownOutlined className="text-yellow-600 text-lg" />
                        ) : (
                          <TeamOutlined className="text-neutral-400 text-lg" />
                        )}
                        <span className="text-sm text-neutral-700">
                          {member.user.name}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {member.contact?.email ?? ''}
                        {member.contact?.phoneNumber
                          ? ` · ${member.contact.phoneNumber}`
                          : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="block text-sm font-medium text-neutral-700">
                  Created
                </span>
                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
                  <CalendarOutlined className="text-neutral-500" />
                  <span className="text-sm text-neutral-700">
                    {formatDateTime(team.createdAt)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-sm font-medium text-neutral-700">
                  Last Updated
                </span>
                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
                  <CalendarOutlined className="text-neutral-500" />
                  <span className="text-sm text-neutral-700">
                    {formatDateTime(team.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-neutral-200 pt-4">
            <span className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <TrophyOutlined className="text-yellow-600" />
              Winner
              {winner && (
                <span className="text-xs font-normal text-neutral-500">
                  (rank {winner.rank} sejak{' '}
                  {new Date(winner.announcedAt).toLocaleDateString('id-ID')})
                </span>
              )}
            </span>
            <div className="grid grid-cols-12 gap-3 items-end">
              <label className="col-span-3 text-sm text-neutral-600">
                Rank
                <input
                  type="number"
                  min={1}
                  value={rank}
                  onChange={(e) => setRank(Number(e.target.value))}
                  className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
              </label>
              <label className="col-span-9 text-sm text-neutral-600">
                Prize
                <input
                  type="text"
                  maxLength={HACKATHON_LIMIT.PRIZE_MAX}
                  value={prize}
                  placeholder="Opsional"
                  onChange={(e) => setPrize(e.target.value)}
                  className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
              </label>
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="sm"
                disabled={
                  !Number.isInteger(rank) || rank < 1 || setWinner.isPending
                }
                onClick={handleSetWinner}
              >
                {winner ? 'Update Winner' : 'Set as Winner'}
              </Button>
              {winner && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={removeWinner.isPending}
                  onClick={handleRemoveWinner}
                >
                  Remove Winner
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-neutral-200">
          <Button
            variant="danger"
            size="md"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2"
          >
            <DeleteOutlined />
            Delete Team
          </Button>

          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center">
                <ExclamationOutlined className="text-danger-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  Delete Team
                </h3>
                <p className="text-sm text-neutral-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-sm text-neutral-700 mb-6">
              Are you sure you want to delete "{team.name}"? This will
              permanently remove the team and all associated data.
            </p>

            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDelete}
                disabled={removeTeam.isPending}
                className="flex items-center gap-2"
              >
                <DeleteOutlined />
                Delete Team
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalTeamDetail;
