import { AnimatePresence, motion } from 'framer-motion';
import {
  UPLOAD_VIDEO_REQUIRED_MODAL_BODY,
  UPLOAD_VIDEO_REQUIRED_MODAL_TITLE,
} from '../../lib/roleplay/copy';

export interface VideoRequiredModalProps {
  open: boolean;
  onClose: () => void;
}

export default function VideoRequiredModal({ open, onClose }: VideoRequiredModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-overlay roleplay-video-required-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-required-title"
          onClick={onClose}
        >
          <motion.div
            className="modal-card roleplay-video-required-modal"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="eyebrow">Required step</p>
            <h2 id="video-required-title">{UPLOAD_VIDEO_REQUIRED_MODAL_TITLE}</h2>
            <p className="roleplay-video-required-modal-message">
              {UPLOAD_VIDEO_REQUIRED_MODAL_BODY}
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn--primary" onClick={onClose}>
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
