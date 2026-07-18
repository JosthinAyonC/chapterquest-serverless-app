import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  COOKIE_BANNER_ACCEPT,
  COOKIE_BANNER_EXIT,
  COOKIE_BANNER_TEXT,
} from '../lib/roleplay/copy';
import { acceptCookieConsent, hasCookieConsent } from '../lib/consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => !hasCookieConsent());

  if (!visible) return null;

  const handleAccept = () => {
    acceptCookieConsent();
    setVisible(false);
  };

  const handleExit = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <AnimatePresence>
      <motion.aside
        className="cookie-consent-banner"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-live="polite"
      >
        <div className="cookie-consent-inner">
          <p id="cookie-consent-title" className="cookie-consent-text">
            {COOKIE_BANNER_TEXT}{' '}
            <Link to="/terms" className="cookie-consent-link">
              Terms and Conditions
            </Link>
            .
          </p>
          <div className="cookie-consent-actions">
            <button type="button" className="btn btn--primary" onClick={handleAccept}>
              {COOKIE_BANNER_ACCEPT}
            </button>
            <button type="button" className="btn btn--ghost" onClick={handleExit}>
              {COOKIE_BANNER_EXIT}
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
