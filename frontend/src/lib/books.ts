import type { Book } from '../mocks/books';
import type { LibraryBookResponse } from '../lib/api';

const COVER_COLORS = [
  '#633A2C',
  '#800000',
  '#B88A2C',
  '#4a6741',
  '#B8860B',
  '#5c4033',
];

export function mapApiBook(apiBook: LibraryBookResponse, index: number): Book {
  const id = apiBook.key.replace(/\.pdf$/i, '');
  return {
    id,
    key: apiBook.key,
    title: apiBook.title,
    author: apiBook.author,
    language: apiBook.language,
    level: '—',
    audience: apiBook.audience,
    summary: apiBook.description || 'No description available.',
    description: apiBook.description,
    coverColor: COVER_COLORS[index % COVER_COLORS.length],
    coverUrl: apiBook.coverUrl ?? undefined,
  };
}
