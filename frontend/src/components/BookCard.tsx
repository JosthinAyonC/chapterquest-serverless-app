import type { Book } from '../types/book';
import BookCardSummary from './BookCardSummary';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <article className="book-card" tabIndex={0} aria-label={`${book.title} by ${book.author}`}>
      <div className="book-card-inner">
        <div className="book-card-face book-card-front">
          <div
            className="book-cover"
            style={
              book.coverUrl
                ? undefined
                : {
                    background: `linear-gradient(160deg, ${book.coverColor}, ${book.coverColor}cc)`,
                  }
            }
          >
            {book.coverUrl ? (
              <img src={book.coverUrl} alt="" className="book-cover-image" loading="lazy" />
            ) : (
              <div className="book-cover-text">
                <h3>{book.title}</h3>
                <p>{book.author}</p>
              </div>
            )}
          </div>
          <div className="book-meta">
            <div className="book-tags">
              <span className="tag">{book.language}</span>
              {book.audience ? (
                <span className="tag tag--audience">{book.audience}</span>
              ) : null}
              {book.level !== '—' ? (
                <span className="tag">Grade {book.level}</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="book-card-face book-card-back">
          <h3>{book.title}</h3>
          <p className="book-card-author">{book.author}</p>
          <BookCardSummary text={book.summary} />
        </div>
      </div>
    </article>
  );
}

export function BookCardAnimated({ book, index }: BookCardProps & { index: number }) {
  return (
    <div
      className="library-grid-item"
      role="listitem"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <BookCard book={book} />
    </div>
  );
}
