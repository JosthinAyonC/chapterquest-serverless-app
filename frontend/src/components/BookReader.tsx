import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import HTMLFlipBook from 'react-pageflip';
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface BookReaderProps {
  previewUrl: string | null;
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

export default function BookReader({ previewUrl }: BookReaderProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

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
          const viewport = page.getViewport({ scale: 1.35 });
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
  }, [previewUrl]);

  if (!previewUrl) return null;

  let content: ReactNode;
  if (loading) {
    content = <p className="book-reader-status">Opening book…</p>;
  } else if (error) {
    content = (
      <p className="book-reader-status book-reader-status--error">{error}</p>
    );
  } else if (pages.length === 0) {
    content = <p className="book-reader-status">No pages found in this PDF.</p>;
  } else if (reducedMotion) {
    content = (
      <div className="book-reader-scroll">
        {pages.map((src, index) => (
          <img key={src} src={src} alt={`Page ${index + 1}`} />
        ))}
      </div>
    );
  } else {
    content = (
      <HTMLFlipBook
        className="book-flipbook"
        width={320}
        height={450}
        size="stretch"
        minWidth={260}
        maxWidth={520}
        minHeight={360}
        maxHeight={620}
        showCover
        mobileScrollSupport
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
    <section className="book-reader" aria-label="Book reader">
      {content}
    </section>
  );
}
