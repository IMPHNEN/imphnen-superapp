import type { FC } from 'react';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import {
  CloseOutlined,
  LinkOutlined,
  ProjectOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import type { THackathonSubmission } from '../../_hooks/use-hackathon';
import { cn } from '@imphnen-frontend-service/utils';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: THackathonSubmission;
}

const SubmissionModal: FC<SubmissionModalProps> = ({
  isOpen,
  onClose,
  submission,
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-success-50 border-success-200 text-success-800';
      case 'pending':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-neutral-50 border-neutral-200 text-neutral-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
              <ProjectOutlined className="text-success-600 text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                {submission.projectName}
              </h2>
              <p className="text-sm text-neutral-500">
                Team: {submission.team.name} •{' '}
                {submission.submittedAt
                  ? `Submitted ${new Date(
                      submission.submittedAt
                    ).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}`
                  : 'Not submitted yet'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
          >
            <CloseOutlined className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div
            className={cn(
              'flex items-center gap-3 p-4 border rounded-lg',
              getStatusColor(submission.status)
            )}
          >
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                submission.status === 'submitted' && 'bg-success-500',
                submission.status === 'pending' && 'bg-orange-500',
                submission.status === 'draft' && 'bg-neutral-400'
              )}
            ></div>
            <div>
              <p className="text-sm font-medium">
                Status:{' '}
                {submission.status.charAt(0).toUpperCase() +
                  submission.status.slice(1)}
              </p>
              <p className="text-xs">
                Created by: {submission.createdBy ?? '-'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">
              Project Description
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {submission.description}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-700">
              Project Links
            </h3>

            <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
              <LinkOutlined className="text-primary-500 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-600 mb-1">
                  Repository
                </p>
                <a
                  href={submission.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline break-all"
                >
                  {submission.repositoryUrl}
                </a>
              </div>
            </div>

            {submission.demoUrl && (
              <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                <LinkOutlined className="text-primary-500 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-600 mb-1">
                    Live Demo
                  </p>
                  <a
                    href={submission.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline break-all"
                  >
                    {submission.demoUrl}
                  </a>
                </div>
              </div>
            )}

            {submission.videoUrl && (
              <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                <LinkOutlined className="text-primary-500 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-600 mb-1">
                    Video
                  </p>
                  <a
                    href={submission.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline break-all"
                  >
                    {submission.videoUrl}
                  </a>
                </div>
              </div>
            )}

            {submission.presentationUrl && (
              <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                <LinkOutlined className="text-primary-500 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-600 mb-1">
                    Presentation
                  </p>
                  <a
                    href={submission.presentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline break-all"
                  >
                    {submission.presentationUrl}
                  </a>
                </div>
              </div>
            )}
          </div>

          {submission.screenshots && submission.screenshots.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                <FileImageOutlined className="text-primary-500" />
                Screenshots ({submission.screenshots.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {submission.screenshots.map((screenshot, index) => (
                  <a
                    key={screenshot.key}
                    href={screenshot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden border border-neutral-200 hover:border-primary-300 transition-colors"
                  >
                    <img
                      src={screenshot.url}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-40 object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
            <div>
              <p className="text-xs text-neutral-500 mb-1">Created</p>
              <p className="text-sm text-neutral-900">
                {new Date(submission.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Last Updated</p>
              <p className="text-sm text-neutral-900">
                {new Date(submission.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionModal;
