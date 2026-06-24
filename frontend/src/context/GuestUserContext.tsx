import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const GUEST_COOKIE_NAME = 'litcircle_guest_name';
const COOKIE_MAX_AGE_DAYS = 365;

export interface GuestUser {
  username: string;
  isGuest: true;
}

interface GuestUserContextValue {
  guest: GuestUser | null;
  setGuestUsername: (username: string) => void;
  clearGuest: () => void;
  isLoading: boolean;
}

const GuestUserContext = createContext<GuestUserContextValue | undefined>(
  undefined,
);

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeDays: number): void {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function GuestUserProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<GuestUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = readCookie(GUEST_COOKIE_NAME);
    if (stored) {
      setGuest({ username: stored, isGuest: true });
    }
    setIsLoading(false);
  }, []);

  const setGuestUsername = useCallback((username: string) => {
    const trimmed = username.trim();
    if (!trimmed) return;
    writeCookie(GUEST_COOKIE_NAME, trimmed, COOKIE_MAX_AGE_DAYS);
    setGuest({ username: trimmed, isGuest: true });
  }, []);

  const clearGuest = useCallback(() => {
    deleteCookie(GUEST_COOKIE_NAME);
    setGuest(null);
  }, []);

  const value = useMemo(
    () => ({ guest, setGuestUsername, clearGuest, isLoading }),
    [guest, setGuestUsername, clearGuest, isLoading],
  );

  return (
    <GuestUserContext.Provider value={value}>
      {children}
    </GuestUserContext.Provider>
  );
}

export function useGuestUser(): GuestUserContextValue {
  const ctx = useContext(GuestUserContext);
  if (!ctx) {
    throw new Error('useGuestUser must be used within GuestUserProvider');
  }
  return ctx;
}
