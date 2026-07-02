import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface TimeUpModalProps {
  open: boolean;
  endedEarly?: boolean;
  onGoToReview: () => void;
  onDismiss: () => void;
}

export default function TimeUpModal({
  open,
  endedEarly = false,
  onGoToReview,
  onDismiss,
}: TimeUpModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="time-up-title"
          onClick={onDismiss}
        >
          <motion.div
            className="modal-card"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="time-up-title">
              {endedEarly ? 'Activity finished early' : "Time's up!"}
            </h2>
            <p>
              {endedEarly
                ? 'You wrapped up before the timer ended. When you are ready, move on to share your reviews.'
                : 'Great work, circle! When you are ready, move on to share your reviews on the wall.'}
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn--primary" onClick={onGoToReview}>
                Let&apos;s review
              </button>
              <Link to="/review" className="btn btn--secondary" onClick={onGoToReview}>
                Go to Review Wall
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
