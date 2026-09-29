import QRCode from 'qrcode';
import { type ReactElement, useEffect, useState } from 'react';

type TCampaignQrCodeProps = {
  url: string;
  size?: number;
  className?: string;
};

export const useQrDataUrl = (url: string, size: number): string | null => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { width: size, margin: 4, errorCorrectionLevel: 'M' })
      .then((result) => {
        if (!cancelled) setDataUrl(result);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url, size]);

  return dataUrl;
};

export const CampaignQrCode = ({
  url,
  size = 64,
  className,
}: TCampaignQrCodeProps): ReactElement => {
  const dataUrl = useQrDataUrl(url, size * 4);

  if (!dataUrl) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <a href={dataUrl} download="qr-campaign.png" title="Download QR code">
      <img
        src={dataUrl}
        alt={`QR code for ${url}`}
        width={size}
        height={size}
        className={className}
      />
    </a>
  );
};
