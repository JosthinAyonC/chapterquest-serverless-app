import { motion } from 'framer-motion';
import { BookCardAnimated } from '../components/BookCard';
import PageLoader from '../components/PageLoader';
import { useBooks } from '../hooks/useBooks';
import { fadeUp } from '../theme/motion';

export default function LibraryPage() {
  const { books, loading, error } = useBooks();

  return (
    <section className="page library-page">
      <motion.header
        className="page-header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="eyebrow">Read</p>
        <h1>Library</h1>
        <p className="page-subtitle">
          Curated books for your literary circle. Hover a card to preview the
          summary — language tags help you pick the right read.
        </p>
      </motion.header>

      {loading ? (
        <PageLoader label="Loading library" />
      ) : error ? (
        <p className="page-subtitle" role="alert">
          {error}
        </p>
      ) : books.length === 0 ? (
        <p className="page-subtitle">No books in the catalog yet.</p>
      ) : (
        <div className="library-grid" role="list">
          {books.map((book, index) => (
            <BookCardAnimated key={book.key ?? book.id} book={book} index={index} />
          ))}
        </div>
      )}

      <motion.p
        className="library-contact-note"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        If you have a book you&apos;d like to add to the library, please contact
        an{' '}
        <a
          className="library-contact-link"
          href="mailto:dannabailonbailon@gmail.com"
        >
          admin
        </a>
        .
      </motion.p>
    </section>
  );
}
