import { motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import BookReader from './BookReader';

interface BookReaderModalProps {
  open: boolean;
  previewUrl: string | null;
  bookTitle: string;
  headerTimer?: ReactNode;
  onMinimizedChange?: (minimized: boolean) => void;
}

export default function BookReaderModal({
  open,
  previewUrl,
  bookTitle,
  headerTimer,
  onMinimizedChange,
}: BookReaderModalProps) {
  const [minimized, setMinimized] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setMinimized(false);
      onMinimizedChange?.(false);
    }
    wasOpenRef.current = open;
  }, [open, onMinimizedChange]);

  useEffect(() => {
    document.body.classList.toggle('book-reader-open', open && !minimized);
    return () => document.body.classList.remove('book-reader-open');
  }, [open, minimized]);

  const updateMinimized = (next: boolean) => {
    setMinimized(next);
    onMinimizedChange?.(next);
  };

  if (!open) return null;

  return (
    <>
      {minimized ? (
        <motion.div
          className="book-reader-dock"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          role="complementary"
          aria-label="Minimized book reader"
        >
          <span className="book-reader-dock-title">{bookTitle}</span>
          <button
            type="button"
            className="book-reader-dock-btn"
            onClick={() => updateMinimized(false)}
            aria-label="Open book reader"
          >
            Open book
          </button>
        </motion.div>
      ) : null}

      <motion.div
        className={`book-reader-overlay${minimized ? ' book-reader-overlay--minimized' : ''}`}
        animate={{ opacity: minimized ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        aria-hidden={minimized}
        role="dialog"
        aria-modal={!minimized}
        aria-labelledby="book-reader-title"
      >
        <header className="book-reader-overlay-bar">
          <div className="book-reader-overlay-bar-main">
            <p className="eyebrow">Reading</p>
            <h2 id="book-reader-title">{bookTitle}</h2>
          </div>
          <div className="book-reader-overlay-bar-actions">
            {headerTimer ? (
              <div className="book-reader-overlay-inline-timer">{headerTimer}</div>
            ) : null}
            <button
              type="button"
              className="book-reader-overlay-minimize"
              onClick={() => updateMinimized(true)}
              aria-label="Minimize book reader"
            >
              Minimize
            </button>
          </div>
        </header>
        <div className="book-reader-overlay-body book-reader-scroll-hidden">
          <BookReader previewUrl={previewUrl} layout="fullscreen" />
        </div>
      </motion.div>
    </>
  );
}
