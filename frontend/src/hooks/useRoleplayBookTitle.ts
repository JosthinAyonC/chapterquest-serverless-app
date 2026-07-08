import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlaySession } from '../context/PlaySessionContext';
import { MOCK_BOOKS } from '../mocks/books';
import {
  getActiveRoleplayCode,
  loadPublishedSession,
} from '../lib/roleplay/session';

export interface RoleplayBookInfo {
  title: string | null;
  coverColor: string | null;
  sessionCode: string | null;
  loading: boolean;
}

function coverColorForTitle(title: string | null): string | null {
  if (!title) return null;
  return MOCK_BOOKS.find((book) => book.title === title)?.coverColor ?? null;
}

function sessionCodeFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/roleplay\/([^/]+)/i);
  return match?.[1]?.trim().toUpperCase() ?? null;
}

export function useRoleplayBookTitle(): RoleplayBookInfo {
  const { pathname } = useLocation();
  const { selectedBook } = usePlaySession();
  const isHost = pathname === '/review/host';
  const playerCode = sessionCodeFromPath(pathname);
  const sessionCode = isHost ? getActiveRoleplayCode() : playerCode;

  const [resolvedTitle, setResolvedTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionCode));

  const contextTitle = isHost ? (selectedBook?.title ?? null) : null;
  const title = contextTitle ?? resolvedTitle;

  useEffect(() => {
    if (!sessionCode) {
      setResolvedTitle(null);
      setLoading(false);
      return;
    }

    if (isHost && selectedBook?.title) {
      setResolvedTitle(selectedBook.title);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void loadPublishedSession(sessionCode)
      .then((session) => {
        if (!cancelled) setResolvedTitle(session?.bookTitle ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isHost, selectedBook?.title, sessionCode]);

  return {
    title,
    coverColor: coverColorForTitle(title) ?? selectedBook?.coverColor ?? null,
    sessionCode,
    loading,
  };
}
