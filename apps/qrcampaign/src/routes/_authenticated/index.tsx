import { Button } from '@imphnen-frontend-service/ui/atoms';
import { createFileRoute } from '@tanstack/react-router';
import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Dropzone } from '../../app/features/watermark/components/Dropzone';
import { CampaignQrCode } from '../../components/CampaignQrCode';
import { useActiveCampaign, useWatermark } from './_hooks/use-watermark';

export const Route = createFileRoute('/_authenticated/')({
  component: HomePage,
});

function HomePage(): ReactElement {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [generatedFile, setGeneratedFile] = useState<File | null>(null);
  const activeCampaign = useActiveCampaign();
  const watermark = useWatermark();
  const isLoading = watermark.isPending;

  const originalImage = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile]
  );
  const generatedImage = useMemo(
    () => (generatedFile ? URL.createObjectURL(generatedFile) : null),
    [generatedFile]
  );

  useEffect(
    () => () => {
      if (originalImage) URL.revokeObjectURL(originalImage);
    },
    [originalImage]
  );
  useEffect(
    () => () => {
      if (generatedImage) URL.revokeObjectURL(generatedImage);
    },
    [generatedImage]
  );

  const handleImageDropped = (file: File) => {
    setImageFile(file);
    setGeneratedFile(null);
    toast.success('Image selected ready for generation!');
  };

  const handleReset = () => {
    setImageFile(null);
    setGeneratedFile(null);
  };

  const handleGenerate = (): void => {
    if (!imageFile) return;

    watermark.mutate(
      { image: imageFile },
      {
        onSuccess: (file) => {
          setGeneratedFile(file);
          toast.success('QR Code generated successfully!');
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to generate QR code.');
        },
      }
    );
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `qr-campaign-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          QR Code Generator
        </h1>
        <p className="text-gray-600">
          Upload your image to add the campaign QR code watermark.
        </p>
        {activeCampaign.data ? (
          <div className="mt-4 inline-flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2">
            <CampaignQrCode url={activeCampaign.data.url} size={40} />
            <span className="text-sm text-gray-700">
              Active campaign: <strong>{activeCampaign.data.name}</strong>
            </span>
          </div>
        ) : activeCampaign.isError ? (
          <p className="mt-4 text-sm text-amber-700">
            There is no active campaign right now.
          </p>
        ) : null}
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {!imageFile ? (
          <Dropzone onImageDropped={handleImageDropped} />
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-full max-w-2xl bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
                  <p className="text-gray-500 font-medium">
                    Processing image...
                  </p>
                </div>
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated with QR"
                  className="w-full h-auto object-contain max-h-[600px]"
                />
              ) : (
                <div className="relative">
                  <img
                    src={originalImage ?? undefined}
                    alt="Original"
                    className="w-full h-auto object-contain max-h-[400px]"
                  />
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none">
                    <span className="bg-black/60 text-white px-3 py-1 rounded-2xl text-sm">
                      Original Image
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {!generatedImage && !isLoading && (
                <>
                  <Button
                    variant="bordered"
                    onClick={handleReset}
                    className="w-32"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleGenerate}
                    className="w-40"
                    disabled={isLoading}
                  >
                    Generate QR
                  </Button>
                </>
              )}

              {generatedImage && (
                <>
                  <Button variant="bordered" onClick={handleReset}>
                    Upload Another
                  </Button>
                  <Button variant="primary" onClick={handleDownload}>
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
