import { AnimatePresence, motion } from 'framer-motion';

interface ConfirmFinishModalProps {
  open: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export default function ConfirmFinishModal({
  open,
  onConfirm,
  onDismiss,
}: ConfirmFinishModalProps) {
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
          aria-labelledby="finish-early-title"
          onClick={onDismiss}
        >
          <motion.div
            className="modal-card"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="finish-early-title">Finish early?</h2>
            <p>
              Are you sure you want to end the reading activity before the timer
              runs out? You can still move on to reviews when ready.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn--primary" onClick={onConfirm}>
                Yes, finish now
              </button>
              <button type="button" className="btn btn--secondary" onClick={onDismiss}>
                Keep reading
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
