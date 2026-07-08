import { motion, AnimatePresence } from 'framer-motion';

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
                ? 'You wrapped up before the timer ended. When you are ready, invite the circle to complete their role reviews.'
                : 'Great work, circle! When you are ready, share the QR so everyone can complete their role review.'}
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn--primary" onClick={onGoToReview}>
                Start role reviews
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
