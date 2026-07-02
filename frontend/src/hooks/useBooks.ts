import { useEffect, useState } from 'react';
import { ApiError, getLibrary } from '../lib/api';
import { mapApiBook } from '../lib/books';
import type { Book } from '../mocks/books';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getLibrary()
      .then((apiBooks) => {
        if (cancelled) return;
        setBooks(apiBooks.map((book, index) => mapApiBook(book, index)));
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setBooks([]);
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Could not load the library catalog.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { books, loading, error };
}
