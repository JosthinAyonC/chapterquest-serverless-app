import { AnimatePresence, motion } from 'framer-motion';

export interface IncompletePagesModalProps {
  open: boolean;
  message: string;
  missingPages: number[];
  onClose: () => void;
  onGoToPage: (pageIndex: number) => void;
}

export default function IncompletePagesModal({
  open,
  message,
  missingPages,
  onClose,
  onGoToPage,
}: IncompletePagesModalProps) {
  const firstMissingIndex = missingPages[0] ? missingPages[0] - 1 : 0;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-overlay roleplay-incomplete-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="incomplete-pages-title"
          onClick={onClose}
        >
          <motion.div
            className="modal-card roleplay-incomplete-modal"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="eyebrow">Worksheet incomplete</p>
            <h2 id="incomplete-pages-title">Both pages are required</h2>
            <p className="roleplay-incomplete-modal-message">{message}</p>
            <div className="modal-actions">
              {missingPages.length > 0 ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => onGoToPage(firstMissingIndex)}
                >
                  Go to Page {missingPages[0]}
                </button>
              ) : null}
              <button type="button" className="btn btn--ghost" onClick={onClose}>
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
