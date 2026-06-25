import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { registerGuest as registerGuestApi } from '../lib/api';
import {
  deleteGuestCookie,
  readGuestCookie,
  writeGuestCookie,
} from '../lib/cookies';
import { GuestUserContext, type GuestUser } from './guest-user-context';

export function GuestUserProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<GuestUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = readGuestCookie();
    if (stored) {
      setGuest({ username: stored, isGuest: true });
    }
    setIsLoading(false);
  }, []);

  const registerGuest = useCallback(async (username: string) => {
    const result = await registerGuestApi(username);
    writeGuestCookie(result.username);
    setGuest({ username: result.username, isGuest: true });
  }, []);

  const clearGuest = useCallback(() => {
    deleteGuestCookie();
    setGuest(null);
  }, []);

  const value = useMemo(
    () => ({ guest, registerGuest, clearGuest, isLoading }),
    [guest, registerGuest, clearGuest, isLoading],
  );

  return (
    <GuestUserContext.Provider value={value}>
      {children}
    </GuestUserContext.Provider>
  );
}
