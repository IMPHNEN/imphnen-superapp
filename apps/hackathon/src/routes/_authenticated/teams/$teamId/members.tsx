import { type FC, type ReactElement, useState } from 'react';
import { Button, Input } from '@imphnen-frontend-service/ui/atoms';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { HACKATHON_MEMBER_ROLE } from '@app/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  useInvitationCreate,
  useJoinRequestRespond,
  useTeamJoinRequests,
} from '../../../../hooks/use-requests';
import {
  useMemberRemove,
  useTeam,
  useTeamRole,
} from '../../../../hooks/use-teams';
import { toastError } from '../../../../lib/errors';
import {
  inviteMemberSchema,
  type TInviteMemberForm,
} from '../../../../lib/forms';

const ManageMembersPage: FC = (): ReactElement => {
  const { teamId } = Route.useParams();
  const navigate = useNavigate();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: team, isLoading: isLoadingTeam } = useTeam(teamId);
  const isLoadingMembers = isLoadingTeam;
  const { isLeader } = useTeamRole(team);
  const { data: joinRequestsData } = useTeamJoinRequests(teamId, isLeader);

  const { mutateAsync: inviteMember, isPending: isInviting } =
    useInvitationCreate();
  const { mutateAsync: removeMember, isPending: isRemoving } =
    useMemberRemove();
  const { mutateAsync: respondToRequest, isPending: isResponding } =
    useJoinRequestRespond();

  const members = team?.members ?? [];
  const joinRequests = (joinRequestsData?.items ?? []).filter(
    (request) => request.status === 'pending'
  );
  const hasSubmission = team?.hasSubmission;

  const form = useForm<TInviteMemberForm>({
    resolver: zodResolver(inviteMemberSchema),
    mode: 'all',
  });

  if (isLoadingTeam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isLeader) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Only the team leader can manage members
        </p>
        <Button
          onClick={() => navigate({ to: '/teams/$teamId', params: { teamId } })}
        >
          Back to Team
        </Button>
      </div>
    );
  }

  const handleInvite = form.handleSubmit(async (data) => {
    try {
      await inviteMember({ teamId, email: data.email });
      toast.success('Invitation sent successfully!');
      setShowInviteModal(false);
      form.reset();
    } catch (error) {
      toastError(error, 'Failed to send invitation');
    }
  });

  const handleRemove = async (userId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember({ teamId, userId });
        toast.success('Member removed');
      } catch (error) {
        toastError(error, 'Failed to remove member');
      }
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await respondToRequest({ id: requestId, accept: true });
      toast.success('Member added successfully!');
    } catch (error) {
      toastError(error, 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await respondToRequest({ id: requestId, accept: false });
      toast.success('Request rejected');
    } catch (error) {
      toastError(error, 'Failed to reject request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-y-4 items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Manage Members
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {team?.name}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowInviteModal(true)}
                disabled={hasSubmission}
                title={
                  hasSubmission
                    ? 'Cannot invite members after project submission'
                    : undefined
                }
              >
                Invite Member
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  navigate({ to: '/teams/$teamId', params: { teamId } })
                }
              >
                Back to Team
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {hasSubmission && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-100">
                  Team Locked
                </h3>
                <p className="text-amber-800 dark:text-amber-200 text-sm font-sans mt-1">
                  Your team has submitted a project. You cannot add or remove
                  members after submission to maintain competition integrity.
                </p>
              </div>
            </div>
          </div>
        )}

        {joinRequests.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-gray-950/50 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Join Requests ({joinRequests.length})
            </h2>
            <div className="space-y-3">
              {joinRequests.map((request) => (
                <div
                  key={request.id}
                  className="border dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {request.user.image ? (
                        <img
                          src={request.user.image}
                          alt={request.user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-500 dark:text-gray-400">
                            👤
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {request.user.name}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic">
                          "{request.message}"
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={isResponding || hasSubmission}
                        title={
                          hasSubmission
                            ? 'Cannot accept members after project submission'
                            : undefined
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={isResponding}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-gray-950/50 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Current Members ({members.length})
          </h2>
          {isLoadingMembers ? (
            <p className="text-gray-600 dark:text-gray-400">
              Loading members...
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.user.id}
                  className="border dark:border-gray-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    {member.user.image ? (
                      <img
                        src={member.user.image}
                        alt={member.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400">
                          👤
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.user.name}
                      </p>
                      {member.contact && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.contact.email}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        {member.role === HACKATHON_MEMBER_ROLE.LEADER && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-primary-900/30 text-blue-800 dark:text-primary-300 rounded text-xs font-medium">
                            Leader
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {member.role !== HACKATHON_MEMBER_ROLE.LEADER &&
                    !hasSubmission && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRemove(member.user.id)}
                        disabled={isRemoving}
                      >
                        Remove
                      </Button>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>

        {!hasSubmission && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Members cannot leave the team without your
              approval. Only you can remove members from the team.
            </p>
          </div>
        )}
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl dark:shadow-gray-950/50 max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Invite Member
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 font-sans">
              Send an invitation to join your team. The invited member will see
              the invitation on their dashboard after logging in.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-sans">
                <strong>Important:</strong> The email you enter must match the
                email address the member uses to sign in.
              </p>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  {...form.register('email')}
                  type="email"
                  placeholder="member@example.com"
                  size="lg"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowInviteModal(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!form.formState.isValid || isInviting}
                >
                  {isInviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute('/_authenticated/teams/$teamId/members')({
  component: ManageMembersPage,
});
