import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { RoleId } from '../../types/role';
import { getRoleplayTemplate } from '../../lib/roleplay/templates';
import {
  loadPlayerProgress,
  savePlayerProgress,
  type RoleplayPlayerProgress,
} from '../../lib/roleplay/storage';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface RoleplayEditorProps {
  sessionCode: string;
  participantName: string;
  roleId: RoleId;
  onFinalize: () => void;
}

export default function RoleplayEditor({
  sessionCode,
  participantName,
  roleId,
  onFinalize,
}: RoleplayEditorProps) {
  const template = getRoleplayTemplate(roleId);
  const isIllustrator = roleId === 'illustrator';
  const [progress, setProgress] = useState<RoleplayPlayerProgress>(() =>
    loadPlayerProgress(sessionCode, participantName),
  );
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    if (progress.mode !== 'online') {
      setProgress((prev) => {
        const next = { ...prev, mode: 'online' as const };
        savePlayerProgress(sessionCode, next);
        return next;
      });
    }
  }, [progress.mode, sessionCode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const doc = await pdfjs.getDocument({ url: template.pdfPath }).promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        if (!cancelled) setPageImage(canvas.toDataURL('image/jpeg', 0.92));
      } catch {
        if (!cancelled) setError('Could not load the review template.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [template.pdfPath]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isIllustrator) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (progress.drawingDataUrl) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = progress.drawingDataUrl;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [isIllustrator, progress.drawingDataUrl]);

  const persistProgress = useCallback(
    (next: RoleplayPlayerProgress) => {
      setProgress(next);
      savePlayerProgress(sessionCode, next);
    },
    [sessionCode],
  );

  const updateField = (id: string, value: string) => {
    persistProgress({
      ...progress,
      textFields: progress.textFields.map((field) =>
        field.id === id ? { ...field, value } : field,
      ),
    });
  };

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handleDrawStart = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isIllustrator) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    const { x, y } = getCanvasPoint(event);
    ctx.strokeStyle = '#800000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleDrawMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !isIllustrator) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { x, y } = getCanvasPoint(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleDrawEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isIllustrator) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = false;
    canvas.releasePointerCapture(event.pointerId);
    persistProgress({
      ...progress,
      drawingDataUrl: canvas.toDataURL('image/png'),
    });
  };

  const handleClearDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    persistProgress({ ...progress, drawingDataUrl: null });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <p className="page-subtitle">Loading your worksheet…</p>;
  }

  if (error) {
    return <p className="form-error">{error}</p>;
  }

  return (
    <div className="roleplay-editor">
      <p className="roleplay-editor-note">
        Your answers save automatically in this browser. If you close the tab,
        come back with the same link and name to continue.
      </p>

      <div className="roleplay-editor-workspace roleplay-editor-workspace--print">
        {pageImage ? (
          <img
            src={pageImage}
            alt="Role review template"
            className="roleplay-editor-page"
          />
        ) : null}

        <div className="roleplay-editor-overlay">
          {progress.textFields.map((field) => (
            <label
              key={field.id}
              className="roleplay-editor-field"
              style={{
                top: field.top,
                left: field.left,
                width: field.width,
                height: field.height,
              }}
            >
              <span className="sr-only">{field.label}</span>
              <textarea
                value={field.value}
                onChange={(e) => updateField(field.id, e.target.value)}
                placeholder={field.label}
                aria-label={field.label}
              />
            </label>
          ))}
          {isIllustrator ? (
            <canvas
              ref={canvasRef}
              className="roleplay-editor-draw"
              onPointerDown={handleDrawStart}
              onPointerMove={handleDrawMove}
              onPointerUp={handleDrawEnd}
              onPointerLeave={handleDrawEnd}
              aria-label="Drawing canvas for illustrator role"
            />
          ) : null}
        </div>
      </div>

      <div className="roleplay-editor-actions">
        {isIllustrator ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleClearDrawing}
          >
            Clear drawing
          </button>
        ) : null}
        <button type="button" className="btn btn--secondary" onClick={handlePrint}>
          Print worksheet
        </button>
        <button type="button" className="btn btn--accent" onClick={onFinalize}>
          Finish review
        </button>
      </div>
    </div>
  );
}
