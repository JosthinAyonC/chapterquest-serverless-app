import { useEffect, useState } from 'react';
import { getLibrary } from '../lib/api';
import { mapApiBook } from '../lib/books';
import { MOCK_BOOKS, type Book } from '../mocks/books';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'mock'>('mock');

  useEffect(() => {
    let cancelled = false;

    getLibrary()
      .then((apiBooks) => {
        if (cancelled) return;
        if (apiBooks.length > 0) {
          setBooks(apiBooks.map((book, index) => mapApiBook(book, index)));
          setSource('api');
        } else {
          setBooks(MOCK_BOOKS);
          setSource('mock');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBooks(MOCK_BOOKS);
          setSource('mock');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { books, loading, source };
}
