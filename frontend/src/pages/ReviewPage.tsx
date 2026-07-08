import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePlaySession } from '../context/PlaySessionContext';
import { getRoleById } from '../mocks/roles';
import { EXTRA_MOCK_REVIEWS } from '../mocks/reviews';
import ReviewCard from '../components/ReviewCard';

export default function ReviewPage() {
  const { participants, reviews, addReview } = usePlaySession();
  const [selectedName, setSelectedName] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const injectedRef = useRef(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (injectedRef.current >= EXTRA_MOCK_REVIEWS.length) return;
      const mock = EXTRA_MOCK_REVIEWS[injectedRef.current];
      injectedRef.current += 1;
      addReview(mock.participantName, mock.message);
    }, 8000);

    return () => window.clearInterval(interval);
  }, [addReview]);

  const rosterNames =
    participants.length > 0
      ? participants.map((p) => p.name)
      : ['Ana', 'Carlos', 'Sofia', 'Diego', 'Emma', 'Lucas'];

  const selectedParticipant = participants.find((p) => p.name === selectedName);
  const selectedRole = selectedParticipant
    ? getRoleById(selectedParticipant.roleId)
    : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedName) {
      setFormError('Pick your name from the roster.');
      return;
    }
    if (!message.trim()) {
      setFormError('Write a short review.');
      return;
    }
    setFormError('');
    addReview(selectedName, message);
    setMessage('');
  };

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Learn Together</p>
        <h1>Review Wall</h1>
        <p className="page-subtitle">
          Share reflections on the reading. Every card shows{' '}
          <strong>name · role</strong> — just like Padlet.
        </p>
        <div className="review-live-badge">
          <span className="review-live-dot" aria-hidden="true" />
          Live updates simulated
        </div>
      </header>

      <div className="review-layout">
        <aside className="review-sidebar">
          <div className="play-panel">
            <h2>Add your review</h2>
            <form className="review-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="review-name">Your name</label>
                <select
                  id="review-name"
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)}
                >
                  <option value="">Select from roster…</option>
                  {rosterNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedRole && (
                <p className="page-subtitle" style={{ margin: 0, fontSize: '0.9rem' }}>
                  Your role: <strong>{selectedRole.nameEn}</strong>
                </p>
              )}
              <div className="form-field">
                <label htmlFor="review-message">Your review</label>
                <textarea
                  id="review-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What did you learn? What connected with you?"
                />
              </div>
              {formError && <p className="form-error">{formError}</p>}
              <button type="submit" className="btn btn--primary">
                Post review
              </button>
            </form>
          </div>
        </aside>

        <div
          className="review-board"
          role="feed"
          aria-label="Review wall"
          aria-live="polite"
        >
          <AnimatePresence mode="popLayout">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
