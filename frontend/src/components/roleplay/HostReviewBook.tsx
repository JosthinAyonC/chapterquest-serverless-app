import { useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export type HostReviewBookPage = 'instructions' | 'videos';

export interface HostReviewBookTab {
  id: HostReviewBookPage;
  label: string;
}

export interface HostReviewBookProps {
  tabs: HostReviewBookTab[];
  activePage: HostReviewBookPage;
  onPageChange: (page: HostReviewBookPage) => void;
  joinPanel: ReactNode;
  instructions: ReactNode;
  videos: ReactNode;
}

export default function HostReviewBook({
  tabs,
  activePage,
  onPageChange,
  joinPanel,
  instructions,
  videos,
}: HostReviewBookProps) {
  const [direction, setDirection] = useState(0);
  const previousPage = useRef(activePage);
  const reducedMotion = useReducedMotion();

  const handleTabChange = (nextPage: HostReviewBookPage) => {
    if (nextPage === activePage) return;
    const tabOrder: HostReviewBookPage[] = ['instructions', 'videos'];
    const prevIndex = tabOrder.indexOf(previousPage.current);
    const nextIndex = tabOrder.indexOf(nextPage);
    setDirection(nextIndex > prevIndex ? 1 : -1);
    previousPage.current = nextPage;
    onPageChange(nextPage);
  };

  const pageVariants = {
    enter: (flipDirection: number) => ({
      rotateY: reducedMotion ? 0 : flipDirection > 0 ? 18 : -18,
      x: reducedMotion ? 0 : flipDirection > 0 ? 48 : -48,
      opacity: 0,
    }),
    center: {
      rotateY: 0,
      x: 0,
      opacity: 1,
    },
    exit: (flipDirection: number) => ({
      rotateY: reducedMotion ? 0 : flipDirection > 0 ? -18 : 18,
      x: reducedMotion ? 0 : flipDirection > 0 ? -48 : 48,
      opacity: 0,
    }),
  };

  return (
    <div className="host-review-book">
      <div className="host-review-book-tabs" role="tablist" aria-label="Host review sections">
        {tabs.map((tab) => {
          const selected = tab.id === activePage;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`host-book-page-${tab.id}`}
              className={`host-review-book-tab${selected ? ' host-review-book-tab--active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="host-review-book-shell">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activePage}
            id={`host-book-page-${activePage}`}
            role="tabpanel"
            className={`host-review-book-page${activePage === 'videos' ? ' host-review-book-page--full' : ''}`}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {activePage === 'instructions' ? (
              <div className="host-review-book-spread">
                <div className="host-review-book-leaf host-review-book-leaf--left">
                  {joinPanel}
                </div>
                <div className="host-review-book-leaf host-review-book-leaf--right">
                  {instructions}
                </div>
              </div>
            ) : (
              <div className="host-review-book-full">{videos}</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
