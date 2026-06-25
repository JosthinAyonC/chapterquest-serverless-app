import { createContext } from 'react';

export interface GuestUser {
  username: string;
  isGuest: true;
}

export interface GuestUserContextValue {
  guest: GuestUser | null;
  registerGuest: (username: string) => Promise<void>;
  clearGuest: () => void;
  isLoading: boolean;
}

export const GuestUserContext = createContext<
  GuestUserContextValue | undefined
>(undefined);
