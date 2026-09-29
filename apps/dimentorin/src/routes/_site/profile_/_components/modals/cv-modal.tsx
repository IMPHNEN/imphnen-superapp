import { type FC, useState } from 'react';
import { ModalButton } from '../buttons/modal-button';
import { FileUploader } from '../shared/file-uploader';

const MAX_CV_SIZE = 5 * 1024 * 1024;

interface CVModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Uploads the CV to the mentor application (`mentor.documentUpload`). */
  onUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export const CVModal: FC<CVModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isLoading = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const cvData = { fileName: file?.name ?? '' };

  const handleSave = async () => {
    if (!file) return;
    try {
      await onUpload(file);
      setFile(null);
      onClose();
    } catch (error) {
      console.error('CV upload failed:', error);
    }
  };

  const handleCancel = () => {
    setFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <button
        className="absolute inset-0 bg-black/20"
        onClick={handleCancel}
        aria-label="Close modal"
        type="button"
      />

      <div className="relative max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-[#F6F6F6] p-5 sm:p-6">
        <div className="rounded-[6px] bg-[#DFECF7] px-4 py-2">
          <h2 className="text-2xl font-semibold leading-8 text-[#4B4B4B]">
            CV/Resume
          </h2>
        </div>

        <div className="space-y-5 pt-8">
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-medium leading-7 text-[#4B4B4B]">
                Upload CV/Resume
              </h3>
              <FileUploader
                accept=".pdf"
                maxSize={MAX_CV_SIZE}
                onFileSelect={setFile}
                isLoading={isLoading}
                dragAndDrop={true}
                description="Klik atau tarik file PDF yang ingin di upload"
                className="w-full"
              />
              <p className="mt-2 text-sm leading-5 text-[#8B8B8B]">
                Format yang didukung: PDF • Maksimal ukuran: 5MB
              </p>
            </div>

            {cvData.fileName && (
              <div className="rounded-[6px] border border-[#BFDCF4] bg-[#EDF7FF] p-4">
                <h4 className="mb-2 text-sm font-medium leading-5 text-[#1F6FA3]">
                  File Terpilih
                </h4>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[6px] bg-[#23A1EB]">
                    <span className="text-xs font-bold text-white">PDF</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-5 text-[#1F6FA3]">
                      {cvData.fileName}
                    </p>
                    <p className="text-xs leading-5 text-[#3A85B8]">
                      Siap untuk disimpan
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-8">
          <ModalButton
            variant="secondary"
            onClick={handleCancel}
            className="w-[110px]"
            disabled={isLoading}
          >
            Batal
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleSave}
            className="w-[110px]"
            disabled={isLoading || !cvData.fileName}
            loading={isLoading}
          >
            {isLoading ? 'Menyimpan...' : 'Simpan CV'}
          </ModalButton>
        </div>
      </div>
    </div>
  );
};
