import { useEffect, useState } from 'react';

interface BookSize {
  width: number;
  height: number;
}

export interface FullscreenBookSize extends BookSize {
  ready: boolean;
}

/** A4 portrait width / height */
const PAGE_ASPECT = 0.707;

function getInitialSize(): BookSize {
  if (typeof window === 'undefined') {
    return { width: 380, height: 520 };
  }

  return window.innerWidth <= 768
    ? { width: 320, height: 452 }
    : { width: 380, height: 520 };
}

function readSafeAreaInsetBottom(): number {
  const probe = document.createElement('div');
  probe.style.paddingBottom = 'env(safe-area-inset-bottom)';
  probe.style.visibility = 'hidden';
  probe.style.position = 'fixed';
  document.body.appendChild(probe);
  const inset = Number.parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return inset;
}

export function useFullscreenBookSize(enabled: boolean): FullscreenBookSize {
  const [size, setSize] = useState<BookSize>(getInitialSize);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return undefined;
    }

    const update = () => {
      const isMobile = window.innerWidth <= 768;
      const viewport = window.visualViewport;
      const viewportH = viewport?.height ?? window.innerHeight;
      const viewportW = viewport?.width ?? window.innerWidth;

      const headerEl = document.querySelector('.book-reader-overlay-bar');
      const measuredHeader = headerEl?.getBoundingClientRect().height ?? 0;
      const overlayHeader =
        measuredHeader > 0 ? measuredHeader : isMobile ? 88 : 68;
      const bodyPadding = isMobile ? 8 : 24;
      const safeBottom = isMobile ? readSafeAreaInsetBottom() : 0;

      const availableH =
        viewportH - overlayHeader - bodyPadding * 2 - safeBottom;
      const availableW = viewportW - bodyPadding * 2;

      let width: number;
      let height: number;

      if (isMobile) {
        width = Math.floor(availableW * 0.96);
        height = Math.floor(width / PAGE_ASPECT);

        if (height > availableH) {
          height = Math.floor(availableH);
          width = Math.floor(height * PAGE_ASPECT);
        }
      } else {
        const maxWidth = Math.min(availableW * 0.52, 560);
        const maxHeight = Math.min(availableH * 0.9, 760);

        height = maxHeight;
        width = Math.round(height * PAGE_ASPECT);

        if (width > maxWidth) {
          width = maxWidth;
          height = Math.round(width / PAGE_ASPECT);
        }

        if (height > maxHeight) {
          height = maxHeight;
          width = Math.round(height * PAGE_ASPECT);
        }
      }

      setSize({
        width: Math.max(isMobile ? 260 : 260, Math.floor(width)),
        height: Math.max(isMobile ? 320 : 360, Math.floor(height)),
      });
      setReady(true);
    };

    update();
    const frame = window.requestAnimationFrame(update);

    const headerEl = document.querySelector('.book-reader-overlay-bar');
    const headerObserver =
      headerEl && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(update)
        : null;
    headerObserver?.observe(headerEl);

    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);

    return () => {
      window.cancelAnimationFrame(frame);
      headerObserver?.disconnect();
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return { ...size, ready };
}
