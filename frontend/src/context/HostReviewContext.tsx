import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PublishedRoleplaySession } from '../lib/roleplay/session';

interface HostReviewContextValue {
  hostSession: PublishedRoleplaySession | null;
  setHostSession: (session: PublishedRoleplaySession | null) => void;
}

const HostReviewContext = createContext<HostReviewContextValue | null>(null);

export function HostReviewProvider({ children }: { children: ReactNode }) {
  const [hostSession, setHostSessionState] =
    useState<PublishedRoleplaySession | null>(null);

  const setHostSession = useCallback((session: PublishedRoleplaySession | null) => {
    setHostSessionState(session);
  }, []);

  const value = useMemo(
    () => ({ hostSession, setHostSession }),
    [hostSession, setHostSession],
  );

  return (
    <HostReviewContext.Provider value={value}>{children}</HostReviewContext.Provider>
  );
}

export function useHostReview(): HostReviewContextValue {
  const ctx = useContext(HostReviewContext);
  if (!ctx) {
    throw new Error('useHostReview must be used within HostReviewProvider');
  }
  return ctx;
}
