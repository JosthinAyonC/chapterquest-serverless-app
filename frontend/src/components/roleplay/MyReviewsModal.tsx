import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import MyReviewCard from './MyReviewCard';
import { useMyHostReviews } from '../../hooks/useMyHostReviews';
import {
  loadPublishedSession,
  type PublishedRoleplaySession,
} from '../../lib/roleplay/session';

interface MyReviewsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function MyReviewsModal({ open, onClose }: MyReviewsModalProps) {
  const navigate = useNavigate();
  const { codes } = useMyHostReviews();
  const [sessions, setSessions] = useState<PublishedRoleplaySession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    void Promise.all(codes.map((code) => loadPublishedSession(code)))
      .then((results) => {
        if (cancelled) return;
        const loaded = results.filter(
          (session): session is PublishedRoleplaySession => session !== null,
        );
        loaded.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setSessions(loaded);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, codes]);

  const handleSelect = (code: string) => {
    onClose();
    navigate(`/review/host/${code}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay my-reviews-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="my-reviews-title"
          onClick={onClose}
        >
          <motion.div
            className="modal-card my-reviews-modal"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="my-reviews-modal-header">
              <h2 id="my-reviews-title">My reviews</h2>
              <p className="page-subtitle">
                Open a review session saved on this device.
              </p>
            </header>

            {loading ? (
              <p className="my-reviews-modal-loading">Loading sessions…</p>
            ) : sessions.length === 0 ? (
              <p className="my-reviews-modal-empty">
                No saved review sessions on this browser.
              </p>
            ) : (
              <div className="my-reviews-modal-list">
                {sessions.map((session) => (
                  <MyReviewCard
                    key={session.code}
                    session={session}
                    onSelect={() => handleSelect(session.code)}
                  />
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn--secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
