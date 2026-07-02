import { motion } from 'framer-motion';
import { MOCK_BOOKS } from '../mocks/books';
import { BookCardAnimated } from '../components/BookCard';
import { fadeUp } from '../theme/motion';

export default function LibraryPage() {
  return (
    <section className="page">
      <motion.header
        className="page-header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="eyebrow">Read</p>
        <h1>Library</h1>
        <p className="page-subtitle">
          Curated books for your literary circle. Hover a card to preview the
          summary — language and grade level tags help you pick the right read.
        </p>
      </motion.header>

      <div className="library-grid" role="list">
        {MOCK_BOOKS.map((book, index) => (
          <div key={book.id} role="listitem">
            <BookCardAnimated book={book} index={index} />
          </div>
        ))}
      </div>

      <motion.p
        className="page-subtitle"
        style={{ marginTop: '2rem', fontSize: '0.9rem' }}
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        Mock catalog — live books will load from S3 via <code>GET /library</code>.
      </motion.p>
    </section>
  );
}
