import { motion } from 'framer-motion';
import { getRoleById } from '../mocks/roles';
import type { MockReview } from '../mocks/reviews';

interface ReviewCardProps {
  review: MockReview;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const role = getRoleById(review.roleId);

  return (
    <motion.article
      className="review-card"
      style={{ '--role-color': role.color } as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      layout
    >
      <header className="review-card-header">
        <span className="review-card-name">{review.participantName}</span>
        <span className="review-card-role">{role.nameEn}</span>
      </header>
      <p className="review-card-message">{review.message}</p>
    </motion.article>
  );
}
