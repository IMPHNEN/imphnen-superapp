import { type FC, useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { CVModal } from '../modals';
import { SectionWrapper } from '../shared/section-wrapper';
import type { NotificationType } from '../modals/notification-modal';
import { EditSectionButton } from '../buttons/edit-section-button';

interface CvResumeSectionProps {
  /** Legacy public CV link stored on the profile, if any. */
  cvUrl: string;
  /** A CV is uploaded to the mentor application (private, not downloadable). */
  hasUploadedCv: boolean;
  fullname: string;
  onUpload: (file: File) => Promise<void>;
  showNotification: (
    type: NotificationType['type'],
    title: string,
    message?: string
  ) => void;
  isLoading?: boolean;
  isViewOnly?: boolean;
}

export const CvResumeSection: FC<CvResumeSectionProps> = ({
  cvUrl,
  hasUploadedCv,
  fullname,
  onUpload,
  isLoading = false,
  isViewOnly = false,
}) => {
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);

  const displayFileName = cvUrl
    ? `${fullname || 'CV'}.pdf`
    : hasUploadedCv
      ? 'CV terunggah (hanya terlihat oleh tim verifikasi)'
      : 'Belum ada CV';

  const handleDownload = () => {
    if (!cvUrl) return;
    const link = document.createElement('a');
    link.href = cvUrl;
    link.download = displayFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SectionWrapper
      title="CV/Resume"
      editButton={
        !isViewOnly ? (
          <EditSectionButton
            onClick={() => setIsCVModalOpen(true)}
            disabled={isLoading}
          />
        ) : undefined
      }
      delay={0.3}
    >
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="w-10 h-10 bg-gray-300 rounded flex items-center justify-center">
          <span className="text-gray-600 text-xs font-medium">PDF</span>
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{displayFileName}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="flex items-center gap-2"
          disabled={!cvUrl}
          onClick={handleDownload}
        >
          <DownloadOutlined />
          Download
        </Button>
      </div>

      <CVModal
        isOpen={isCVModalOpen && !isViewOnly}
        onClose={() => setIsCVModalOpen(false)}
        onUpload={onUpload}
        isLoading={isLoading}
      />
    </SectionWrapper>
  );
};
