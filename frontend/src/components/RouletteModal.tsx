import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';

interface RouletteModalProps {
  open: boolean;
  children: ReactNode;
}

export default function RouletteModal({ open, children }: RouletteModalProps) {
  useEffect(() => {
    document.body.classList.toggle('roulette-open', open);
    return () => document.body.classList.remove('roulette-open');
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay roulette-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="roulette-modal-title"
        >
          <motion.div
            className="roulette-modal-card"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div className="roulette-modal-glow" aria-hidden="true" />
            <header className="roulette-modal-header">
              <p className="eyebrow">Share</p>
              <h2 id="roulette-modal-title">Role roulette</h2>
              <p className="roulette-modal-subtitle">
                One unique role per participant — watch the wheel decide.
              </p>
            </header>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
