import { useCallback, useEffect, useState } from 'react';
import {
  getHostReviewCodes,
  MY_REVIEWS_CHANGED_EVENT,
} from '../lib/roleplay/host-reviews';

export function useMyHostReviews() {
  const [codes, setCodes] = useState<string[]>(() => getHostReviewCodes());

  const refresh = useCallback(() => {
    setCodes(getHostReviewCodes());
  }, []);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(MY_REVIEWS_CHANGED_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(MY_REVIEWS_CHANGED_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [refresh]);

  return { codes, refresh };
}
