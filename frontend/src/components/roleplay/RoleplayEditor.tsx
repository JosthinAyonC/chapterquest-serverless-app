import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoleId } from '../../types/role';
import {
  WORKSHEET_COMPLETE_NOTE,
  WORKSHEET_CONTINUE_BUTTON,
} from '../../lib/roleplay/copy';
import { downloadReviewPdf, printReviewPdf } from '../../lib/roleplay/canvas-export';
import {
  allPagesHaveContent,
  buildIncompletePagesMessage,
  getIncompletePageNumbers,
  pageCanvasHasContent,
} from '../../lib/roleplay/canvas-pages';
import { renderPdfPages, type PdfPageRender } from '../../lib/roleplay/pdf-render';
import { buildReviewDownloadFilename } from '../../lib/roleplay/review-filename';
import { getRoleplayTemplate } from '../../lib/roleplay/templates';
import {
  loadPlayerProgress,
  PlayerProgressStorageError,
  savePlayerProgress,
  type RoleplayPlayerProgress,
} from '../../lib/roleplay/storage';
import { useFabricEditor } from '../../hooks/useFabricEditor';
import EditorToolbar from './EditorToolbar';
import EditorPageFooter from './EditorPageFooter';
import IncompletePagesModal from './IncompletePagesModal';

interface RoleplayEditorProps {
  sessionCode: string;
  participantName: string;
  roleId: RoleId;
  onWorksheetComplete: () => void;
}

export default function RoleplayEditor({
  sessionCode,
  participantName,
  roleId,
  onWorksheetComplete,
}: RoleplayEditorProps) {
  const template = getRoleplayTemplate(roleId);
  const isIllustrator = roleId === 'illustrator';
  const [progress, setProgress] = useState<RoleplayPlayerProgress>(() =>
    loadPlayerProgress(sessionCode, participantName),
  );
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const [pdfPages, setPdfPages] = useState<PdfPageRender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [incompleteModal, setIncompleteModal] = useState<{
    message: string;
    missingPages: number[];
  } | null>(null);
  const [exportBusy, setExportBusy] = useState(false);

  useEffect(() => {
    if (progress.mode !== 'online') {
      setProgress((prev) => {
        const next = { ...prev, mode: 'online' as const };
        try {
          savePlayerProgress(sessionCode, next);
        } catch (err) {
          setStorageError(
            err instanceof PlayerProgressStorageError
              ? err.message
              : 'Could not save your work to this browser.',
          );
        }
        return next;
      });
    }
  }, [progress.mode, sessionCode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    renderPdfPages(template.pdfPath)
      .then((pages) => {
        if (!cancelled) setPdfPages(pages);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the review template.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [template.pdfPath]);

  const persistCanvasPages = useCallback(
    (canvasPages: (string | null)[]) => {
      const next = { ...progressRef.current, canvasPages };
      savePlayerProgress(sessionCode, next);
      progressRef.current = next;
    },
    [sessionCode],
  );

  const handleStorageError = useCallback((message: string) => {
    setStorageError(message);
  }, []);

  const editor = useFabricEditor({
    pages: pdfPages,
    initialCanvasPages: progress.canvasPages,
    isIllustrator,
    onPersist: persistCanvasPages,
    onStorageError: handleStorageError,
  });

  const requireAllPagesComplete = useCallback((): boolean => {
    const snapshot = editor.getCanvasPagesSnapshot();
    const pagesWithContent = snapshot.map(pageCanvasHasContent);
    if (allPagesHaveContent(pagesWithContent)) {
      setIncompleteModal(null);
      return true;
    }
    const missingPages = getIncompletePageNumbers(pagesWithContent);
    setIncompleteModal({
      message: buildIncompletePagesMessage(missingPages),
      missingPages,
    });
    return false;
  }, [editor]);

  const handleDownloadPdf = async () => {
    if (pdfPages.length === 0 || exportBusy) return;
    if (!requireAllPagesComplete()) return;
    setExportBusy(true);
    setStorageError('');
    try {
      const canvasPages = editor.getCanvasPagesSnapshot();
      const downloadName = buildReviewDownloadFilename(participantName, roleId);
      await downloadReviewPdf(pdfPages, canvasPages, downloadName);
    } catch {
      setStorageError('Could not build the PDF. Try again.');
    } finally {
      setExportBusy(false);
    }
  };

  const handlePrintPdf = async () => {
    if (pdfPages.length === 0 || exportBusy) return;
    if (!requireAllPagesComplete()) return;
    setExportBusy(true);
    setStorageError('');
    try {
      const canvasPages = editor.getCanvasPagesSnapshot();
      await printReviewPdf(pdfPages, canvasPages);
    } catch {
      setStorageError('Could not open the print dialog. Try downloading instead.');
    } finally {
      setExportBusy(false);
    }
  };

  const handleFinalize = () => {
    if (!requireAllPagesComplete()) return;
    onWorksheetComplete();
  };

  const allPagesComplete = allPagesHaveContent(editor.pagesWithContent);

  useEffect(() => {
    if (allPagesComplete) setIncompleteModal(null);
  }, [allPagesComplete]);

  if (loading) {
    return <p className="page-subtitle">Loading your worksheet…</p>;
  }

  if (error) {
    return <p className="form-error">{error}</p>;
  }

  if (pdfPages.length === 0) {
    return <p className="form-error">Could not load the review template.</p>;
  }

  return (
    <div className="roleplay-editor">
      <p className="roleplay-editor-note">
        Your answers save automatically in this browser. If you close the tab,
        come back with the same link and name to continue. {WORKSHEET_COMPLETE_NOTE}
      </p>

      {storageError ? <p className="form-error">{storageError}</p> : null}

      <EditorToolbar
        activeTool={editor.activeTool}
        activePageIndex={editor.activePageIndex}
        pageCount={pdfPages.length}
        strokeColor={editor.strokeColor}
        strokeWidth={editor.strokeWidth}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        canDelete={editor.canDelete}
        isIllustrator={isIllustrator}
        onToolChange={editor.setActiveTool}
        onPageChange={(pageIndex) => void editor.switchPage(pageIndex)}
        onStrokeColorChange={editor.setStrokeColor}
        onStrokeWidthChange={editor.setStrokeWidth}
        onUndo={() => void editor.undo()}
        onRedo={() => void editor.redo()}
        onDeleteSelection={editor.deleteSelection}
        onClearPage={() => void editor.clearPage()}
        onImageUpload={(file) => void editor.insertImage(file)}
      />

      <div className="roleplay-editor-workspace">
        <div ref={editor.containerRef} className="roleplay-editor-canvas-wrap">
          <canvas ref={editor.canvasElementRef} aria-label="Review worksheet canvas" />
          {!editor.ready ? (
            <p className="roleplay-editor-canvas-loading">Preparing canvas…</p>
          ) : null}
        </div>

        <EditorPageFooter
          activePageIndex={editor.activePageIndex}
          pageCount={pdfPages.length}
          pagesWithContent={editor.pagesWithContent}
          onPrevPage={() => {
            if (editor.activePageIndex > 0) {
              void editor.switchPage(editor.activePageIndex - 1);
            }
          }}
          onNextPage={() => {
            if (editor.activePageIndex < pdfPages.length - 1) {
              void editor.switchPage(editor.activePageIndex + 1);
            }
          }}
          onGoToPage={(pageIndex) => void editor.switchPage(pageIndex)}
        />
      </div>

      <div className="roleplay-editor-actions">
        <button
          type="button"
          className="btn btn--secondary"
          disabled={exportBusy || !editor.ready}
          onClick={() => void handleDownloadPdf()}
        >
          Download PDF
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={exportBusy || !editor.ready}
          onClick={() => void handlePrintPdf()}
        >
          Print worksheet
        </button>
        <button
          type="button"
          className="btn btn--accent"
          disabled={!editor.ready}
          onClick={handleFinalize}
        >
          {WORKSHEET_CONTINUE_BUTTON}
        </button>
      </div>

      <IncompletePagesModal
        open={incompleteModal !== null}
        message={incompleteModal?.message ?? ''}
        missingPages={incompleteModal?.missingPages ?? []}
        onClose={() => setIncompleteModal(null)}
        onGoToPage={(pageIndex) => {
          setIncompleteModal(null);
          void editor.switchPage(pageIndex);
        }}
      />
    </div>
  );
}
