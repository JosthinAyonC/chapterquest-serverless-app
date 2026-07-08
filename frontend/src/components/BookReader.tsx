import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import HTMLFlipBook from 'react-pageflip';
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useFullscreenBookSize } from '../hooks/useFullscreenBookSize';
import { useIsMobile } from '../hooks/useIsMobile';
import PageLoader from './PageLoader';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface BookReaderProps {
  previewUrl: string | null;
  layout?: 'inline' | 'fullscreen';
  onReady?: () => void;
}

interface ReaderPageProps {
  pageNumber: number;
  src: string;
}

const ReaderPage = forwardRef<HTMLDivElement, ReaderPageProps>(
  ({ pageNumber, src }, ref) => (
    <div className="book-reader-page" ref={ref} data-page={pageNumber}>
      <img src={src} alt={`Page ${pageNumber}`} draggable={false} />
    </div>
  ),
);
ReaderPage.displayName = 'ReaderPage';

export default function BookReader({
  previewUrl,
  layout = 'inline',
  onReady,
}: BookReaderProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const isFullscreen = layout === 'fullscreen';
  const isMobile = useIsMobile();
  const bookSize = useFullscreenBookSize(isFullscreen);
  const pdfScale = isFullscreen && isMobile ? 2 : 1.35;

  useEffect(() => {
    if (!previewUrl) {
      setPages([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    setPages([]);

    (async () => {
      try {
        const doc = await pdfjs.getDocument({ url: previewUrl }).promise;
        const rendered: string[] = [];

        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
          const page = await doc.getPage(pageNumber);
          const viewport = page.getViewport({ scale: pdfScale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport, canvas }).promise;
          rendered.push(canvas.toDataURL('image/jpeg', 0.88));

          if (cancelled) return;
        }

        if (!cancelled) setPages(rendered);
      } catch {
        if (!cancelled) {
          setError('Could not load the book. Check CORS and try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [previewUrl, pdfScale]);

  const contentReady =
    !loading &&
    !error &&
    pages.length > 0 &&
    (!isFullscreen || isMobile || reducedMotion || bookSize.ready);

  useEffect(() => {
    if (contentReady) onReady?.();
  }, [contentReady, onReady]);

  if (!previewUrl) return null;

  let content: ReactNode;
  if (loading) {
    content = <PageLoader label="Opening book" compact={!isFullscreen} />;
  } else if (error) {
    content = (
      <p className="book-reader-status book-reader-status--error">{error}</p>
    );
  } else if (pages.length === 0) {
    content = <p className="book-reader-status">No pages found in this PDF.</p>;
  } else if (reducedMotion || (isFullscreen && isMobile)) {
    content = (
      <div
        className={`book-reader-scroll${
          isFullscreen && isMobile ? ' book-reader-scroll--mobile-fullscreen' : ''
        }`}
      >
        {pages.map((src, index) => (
          <img key={src} src={src} alt={`Page ${index + 1}`} draggable={false} />
        ))}
      </div>
    );
  } else if (isFullscreen && !bookSize.ready) {
    content = <PageLoader label="Preparing reader" compact />;
  } else {
    content = (
      <HTMLFlipBook
        key={
          isFullscreen
            ? `book-${bookSize.width}x${bookSize.height}`
            : 'book-inline'
        }
        className="book-flipbook"
        width={isFullscreen ? bookSize.width : 320}
        height={isFullscreen ? bookSize.height : 450}
        size={isFullscreen ? 'fixed' : 'stretch'}
        minWidth={isFullscreen ? bookSize.width : 260}
        maxWidth={isFullscreen ? bookSize.width : 520}
        minHeight={isFullscreen ? bookSize.height : 360}
        maxHeight={isFullscreen ? bookSize.height : 620}
        showCover
        mobileScrollSupport={!isFullscreen}
        drawShadow
        usePortrait
      >
        {pages.map((src, index) => (
          <ReaderPage key={`${src.slice(0, 24)}-${index}`} pageNumber={index + 1} src={src} />
        ))}
      </HTMLFlipBook>
    );
  }

  return (
    <section
      className={`book-reader${layout === 'fullscreen' ? ' book-reader--fullscreen' : ''}`}
      style={
        isFullscreen
          ? ({
              '--book-width': `${bookSize.width}px`,
              '--book-height': `${bookSize.height}px`,
            } as CSSProperties)
          : undefined
      }
      aria-label="Book reader"
    >
      {content}
    </section>
  );
}
