import { useContext } from 'react';
import { GuestUserContext } from './guest-user-context';

export function useGuestUser() {
  const ctx = useContext(GuestUserContext);
  if (!ctx) {
    throw new Error('useGuestUser must be used within GuestUserProvider');
  }
  return ctx;
}

export type { GuestUser } from './guest-user-context';
