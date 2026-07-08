import { AnimatePresence, motion } from 'framer-motion';

interface ConfirmRoleIdentityModalProps {
  open: boolean;
  participantName: string;
  roleName: string;
  roleIcon: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmRoleIdentityModal({
  open,
  participantName,
  roleName,
  roleIcon,
  onConfirm,
  onCancel,
}: ConfirmRoleIdentityModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-identity-title"
          onClick={onCancel}
        >
          <motion.div
            className="modal-card roleplay-confirm-card"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow">Just checking</p>
            <h2 id="confirm-identity-title">
              Are you {participantName}?
            </h2>
            <p className="roleplay-confirm-lead">
              You&apos;ll continue as{' '}
              <strong>
                {roleIcon} {roleName}
              </strong>
              . After you confirm, this choice stays on this device for today&apos;s
              review — take a moment to be sure it&apos;s you.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn--ghost" onClick={onCancel}>
                Go back
              </button>
              <button type="button" className="btn btn--primary" onClick={onConfirm}>
                Yes, that&apos;s me
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
