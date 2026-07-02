import { motion } from 'framer-motion';
import type { Book } from '../mocks/books';

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
            style={{ background: `linear-gradient(160deg, ${book.coverColor}, ${book.coverColor}cc)` }}
          >
            <h3>{book.title}</h3>
            <p>{book.author}</p>
          </div>
          <div className="book-meta">
            <div className="book-tags">
              <span className="tag">{book.language}</span>
              <span className="tag">Grade {book.level}</span>
            </div>
          </div>
        </div>
        <div className="book-card-face book-card-back">
          <p>{book.summary}</p>
        </div>
      </div>
    </article>
  );
}

export function BookCardAnimated({ book, index }: BookCardProps & { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.06 }}
    >
      <BookCard book={book} />
    </motion.div>
  );
}
