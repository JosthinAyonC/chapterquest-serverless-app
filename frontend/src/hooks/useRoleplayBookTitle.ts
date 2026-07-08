import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlaySession } from '../context/PlaySessionContext';
import {
  getActiveRoleplayCode,
  loadPublishedSession,
} from '../lib/roleplay/session';

export interface RoleplayBookInfo {
  title: string | null;
  coverUrl: string | null;
  coverColor: string | null;
  sessionCode: string | null;
  loading: boolean;
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
  const [resolvedCoverUrl, setResolvedCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionCode));

  const contextTitle = isHost ? (selectedBook?.title ?? null) : null;
  const contextCoverUrl = isHost ? (selectedBook?.coverUrl ?? null) : null;
  const title = contextTitle ?? resolvedTitle;
  const coverUrl = contextCoverUrl ?? resolvedCoverUrl;

  useEffect(() => {
    if (!sessionCode) {
      setResolvedTitle(null);
      setResolvedCoverUrl(null);
      setLoading(false);
      return;
    }

    if (isHost && selectedBook?.title) {
      setResolvedTitle(selectedBook.title);
      setResolvedCoverUrl(selectedBook.coverUrl ?? null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void loadPublishedSession(sessionCode)
      .then((session) => {
        if (cancelled) return;
        setResolvedTitle(session?.bookTitle ?? null);
        setResolvedCoverUrl(session?.coverUrl ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isHost, selectedBook?.coverUrl, selectedBook?.title, sessionCode]);

  return {
    title,
    coverUrl,
    coverColor: isHost ? (selectedBook?.coverColor ?? null) : null,
    sessionCode,
    loading,
  };
}
