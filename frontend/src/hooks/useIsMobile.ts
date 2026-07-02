import { useEffect, useState } from 'react';

export function useIsMobile(breakpointPx = 768): boolean {
  const query = `(max-width: ${breakpointPx}px)`;

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return isMobile;
}
