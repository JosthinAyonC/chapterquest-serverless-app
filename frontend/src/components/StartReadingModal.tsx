import { AnimatePresence, motion } from 'framer-motion';

interface StartReadingModalProps {
  open: boolean;
  bookTitle: string;
  onStart: () => void;
}

export default function StartReadingModal({
  open,
  bookTitle,
  onStart,
}: StartReadingModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="start-reading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="start-reading-title"
        >
          <motion.div
            className="start-reading-card"
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          >
            <p className="eyebrow">Ready to read</p>
            <h2 id="start-reading-title">Everything set?</h2>
            <p className="start-reading-lead">
              <strong>{bookTitle}</strong> is open. When your circle is ready,
              start the reading timer.
            </p>
            <button
              type="button"
              className="btn btn--accent btn--lg"
              onClick={onStart}
            >
              Click to start
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
