import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface RoleplayQrPanelProps {
  url: string;
  code: string;
}

export default function RoleplayQrPanel({ url, code }: RoleplayQrPanelProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      margin: 1,
      width: 280,
      color: { dark: '#3d2418', light: '#fff9ef' },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="roleplay-qr-panel">
      <p className="roleplay-join-code" aria-label={`Join code ${code}`}>
        {code}
      </p>
      <div className="roleplay-qr-frame">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR code to open role review" />
        ) : (
          <p className="roleplay-qr-fallback">Generating QR…</p>
        )}
      </div>
      <div className="roleplay-link-row">
        <input
          className="roleplay-link-input"
          type="text"
          readOnly
          value={url}
          aria-label="Role review link"
        />
        <button type="button" className="btn btn--secondary" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
