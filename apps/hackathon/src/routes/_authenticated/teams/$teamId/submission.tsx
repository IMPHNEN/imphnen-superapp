import type { FC, ReactElement } from 'react';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { HACKATHON_SUBMISSION_STATUS } from '@app/schemas';
import { toast } from 'sonner';
import { useMyCertificate } from '../../../../hooks/use-public';
import {
  useSubmissionCancel,
  useTeamSubmission,
} from '../../../../hooks/use-submission';
import { useTeam, useTeamRole } from '../../../../hooks/use-teams';
import { isSubmissionClosed } from '../../../../lib/deadlines';
import { toastError } from '../../../../lib/errors';

const SubmissionViewPage: FC = (): ReactElement => {
  const { teamId } = Route.useParams();
  const navigate = useNavigate();
  const { data: team } = useTeam(teamId);
  const { isLeader } = useTeamRole(team);
  const { data: submission, isLoading } = useTeamSubmission(teamId);
  const { data: certificate } = useMyCertificate();
  const { mutateAsync: cancelSubmission, isPending: isCancelling } =
    useSubmissionCancel();

  const handleCancel = async (id: string) => {
    try {
      await cancelSubmission({ id });
      toast.success('Submission moved back to draft');
    } catch (error) {
      toastError(error, 'Failed to cancel submission');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-gray-600 dark:text-gray-400">
          Loading submission...
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No Submission Yet
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Your team hasn't submitted a project
        </p>
        <Button
          onClick={() => navigate({ to: '/teams/$teamId', params: { teamId } })}
        >
          Back to Team
        </Button>
      </div>
    );
  }

  const submittedDate = submission.submittedAt
    ? new Date(submission.submittedAt).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not submitted';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Project Submission
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {team?.name}
              </p>
            </div>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {submission.status === HACKATHON_SUBMISSION_STATUS.SUBMITTED ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-500 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">✅</span>
              <div>
                <h3 className="font-bold text-green-900 dark:text-green-100 text-lg">
                  Project Submitted Successfully
                </h3>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  Submitted on {submittedDate}
                </p>
                <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                  This submission is now read-only and cannot be edited
                </p>
              </div>
            </div>
          </div>
        ) : submission.status === HACKATHON_SUBMISSION_STATUS.PENDING ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">⏳</span>
              <div>
                <h3 className="font-bold text-yellow-900 dark:text-yellow-100 text-lg">
                  Submission Pending Verification
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Your submission is being processed
                </p>
                {isLeader && !isSubmissionClosed() && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    disabled={isCancelling}
                    onClick={() => handleCancel(submission.id)}
                  >
                    {isCancelling ? 'Cancelling...' : 'Back to Draft'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-500 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">📝</span>
              <div>
                <h3 className="font-bold text-orange-900 dark:text-orange-100 text-lg">
                  Draft Submission
                </h3>
                <p className="text-orange-700 dark:text-orange-300 text-sm">
                  This submission is still in draft and has not been finalized
                </p>
              </div>
            </div>
          </div>
        )}

        {submission.status === HACKATHON_SUBMISSION_STATUS.SUBMITTED &&
          certificate &&
          certificate.team.id === teamId && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-500 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-4xl shrink-0">🏆</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-amber-900 dark:text-amber-100 text-lg">
                      View Your Certificate
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300 text-sm">
                      Congratulations! Your personalized certificate is ready to
                      download and share.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    navigate({
                      to: '/certificate/$certId',
                      params: { certId: certificate.id },
                    })
                  }
                  className="shrink-0 px-6 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
                >
                  Get Certificate
                </button>
              </div>
            </div>
          )}

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-gray-950/50 overflow-hidden">
          <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white p-8">
            <h2 className="text-3xl font-bold mb-2">
              {submission.projectName}
            </h2>
            <p className="text-blue-100">Team: {team?.name}</p>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Project Description
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {submission.description}
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Repository
                </h3>
                <a
                  href={submission.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 dark:text-primary-400 hover:text-blue-800 dark:hover:text-primary-300"
                >
                  <span>🔗</span>
                  <span className="break-all">{submission.repositoryUrl}</span>
                </a>
              </div>

              {submission.demoUrl && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    Live Demo
                  </h3>
                  <a
                    href={submission.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 dark:text-primary-400 hover:text-blue-800 dark:hover:text-primary-300"
                  >
                    <span>🌐</span>
                    <span className="break-all">{submission.demoUrl}</span>
                  </a>
                </div>
              )}

              {submission.videoUrl && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    Video
                  </h3>
                  <a
                    href={submission.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 dark:text-primary-400 hover:text-blue-800 dark:hover:text-primary-300"
                  >
                    <span>🎬</span>
                    <span className="break-all">{submission.videoUrl}</span>
                  </a>
                </div>
              )}
            </div>

            {submission.screenshots && submission.screenshots.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Screenshots ({submission.screenshots.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {submission.screenshots.map(({ key, url }, index) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={url}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-primary-500 transition-colors cursor-pointer"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-t-4 border-blue-600 dark:border-primary-500">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                Submission Information
              </h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Status:
                  </span>
                  <span
                    className={`font-medium ${
                      submission.status ===
                      HACKATHON_SUBMISSION_STATUS.SUBMITTED
                        ? 'text-green-600 dark:text-green-400'
                        : submission.status ===
                            HACKATHON_SUBMISSION_STATUS.PENDING
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-orange-600 dark:text-orange-400'
                    }`}
                  >
                    {submission.status === HACKATHON_SUBMISSION_STATUS.SUBMITTED
                      ? '✓ Submitted'
                      : submission.status ===
                          HACKATHON_SUBMISSION_STATUS.PENDING
                        ? '⏳ Pending Verification'
                        : '📝 Draft'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Submitted:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {submittedDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Submission ID:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white font-mono text-xs">
                    {submission.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> This submission is now locked and cannot
                be edited or deleted. If you need to make changes, please
                contact the hackathon organizers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute(
  '/_authenticated/teams/$teamId/submission'
)({
  component: SubmissionViewPage,
});
