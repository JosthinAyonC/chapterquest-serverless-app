import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getBookPreviewUrl } from '../lib/api';
import { usePlaySession } from '../context/PlaySessionContext';
import { useBooks } from '../hooks/useBooks';
import Roulette from '../components/Roulette';
import RouletteModal from '../components/RouletteModal';
import RosterPanel from '../components/RosterPanel';
import CircularTimer from '../components/CircularTimer';
import TimeUpModal from '../components/TimeUpModal';
import ConfirmFinishModal from '../components/ConfirmFinishModal';
import BookReader from '../components/BookReader';

function playOptionalSound() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 523;
    gain.gain.value = 0.08;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    /* audio optional */
  }
}

export default function PlayPage() {
  const navigate = useNavigate();
  const { books, source } = useBooks();
  const {
    phase,
    names,
    participants,
    durationMinutes,
    remainingSeconds,
    timerRunning,
    selectedBook,
    endedEarly,
    setNames,
    spinRoulette,
    confirmRoster,
    selectBook,
    setDuration,
    startTimer,
    tick,
    finishEarly,
    goToReview,
  } = usePlaySession();

  const [nameError, setNameError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const totalSeconds = durationMinutes * 60;

  const validateNames = useCallback((): string[] | null => {
    const trimmed = names.map((n) => n.trim());
    if (trimmed.some((n) => !n)) {
      setNameError('Please enter all six participant names.');
      return null;
    }
    const unique = new Set(trimmed.map((n) => n.toLowerCase()));
    if (unique.size !== 6) {
      setNameError('Each name must be unique.');
      return null;
    }
    setNameError('');
    return trimmed;
  }, [names]);

  const handleSpin = () => {
    const valid = validateNames();
    if (!valid) return;
    setNames(valid);
    spinRoulette(valid);
  };

  const handleStartTimer = () => {
    if (!selectedBook) return;
    startTimer();
  };

  useEffect(() => {
    if (!timerRunning) return undefined;
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, tick]);

  useEffect(() => {
    if (phase === 'finished' && !modalDismissed) {
      playOptionalSound();
      setShowModal(true);
    }
  }, [phase, modalDismissed]);

  useEffect(() => {
    if (!timerRunning || !selectedBook?.key) {
      setPreviewUrl(null);
      return;
    }

    let cancelled = false;
    getBookPreviewUrl(selectedBook.key)
      .then((url) => {
        if (!cancelled) setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [timerRunning, selectedBook?.key]);

  const handleGoToReview = () => {
    setShowModal(false);
    goToReview();
    navigate('/review');
  };

  const handleConfirmFinishEarly = () => {
    setShowFinishModal(false);
    finishEarly();
  };

  const handleRespin = () => {
    const rosterNames = participants.map((p) => p.name);
    if (rosterNames.length === 6) {
      spinRoulette(rosterNames);
    }
  };

  const bookValue = selectedBook?.key ?? selectedBook?.id ?? '';

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Play</p>
        <h1>Let&apos;s play</h1>
        <p className="page-subtitle">
          Set up your circle: names, roles, book, and timer. The roster stays
          visible throughout.
        </p>
      </header>

      <div className="play-layout">
        <div>
          {(phase === 'setup' || phase === 'roulette') && (
            <motion.div
              className="play-panel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2>Step 1 — Participant names</h2>
              <div className="names-grid">
                {names.map((name, i) => (
                  <div className="form-field" key={`name-${i}`}>
                    <label htmlFor={`participant-${i}`}>
                      Participant {i + 1}
                    </label>
                    <input
                      id={`participant-${i}`}
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const next = [...names];
                        next[i] = e.target.value;
                        setNames(next);
                      }}
                      placeholder={`Name ${i + 1}`}
                      autoComplete="off"
                      disabled={phase === 'roulette'}
                    />
                  </div>
                ))}
              </div>
              {nameError && <p className="form-error">{nameError}</p>}
              <div className="play-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleSpin}
                  disabled={phase === 'roulette'}
                >
                  Spin the roulette
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'confirmed' && (
            <motion.div
              className="play-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2>Step 2 — Confirm roster</h2>
              <p className="page-subtitle">
                Check that every name has the right role before continuing.
              </p>
              <div className="play-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleRespin}
                >
                  Spin again
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={confirmRoster}
                >
                  Looks good — choose book
                </button>
              </div>
            </motion.div>
          )}

          {(phase === 'timer' || phase === 'finished') && (
            <motion.div
              className="play-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2>Step 3 — Reading time</h2>

              {!timerRunning && phase !== 'finished' && (
                <>
                  <div className="form-field" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="book-select">Select a book</label>
                    <select
                      id="book-select"
                      value={bookValue}
                      onChange={(e) => {
                        const book = books.find(
                          (b) => (b.key ?? b.id) === e.target.value,
                        );
                        if (book) selectBook(book);
                      }}
                    >
                      <option value="">Choose from library…</option>
                      {books.map((b) => (
                        <option key={b.key ?? b.id} value={b.key ?? b.id}>
                          {b.title} — {b.author}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="timer-config">
                    <label htmlFor="duration">Minutes</label>
                    <input
                      id="duration"
                      type="number"
                      min={5}
                      max={120}
                      value={durationMinutes}
                      onChange={(e) =>
                        setDuration(Math.max(5, Number(e.target.value) || 40))
                      }
                    />
                    <span className="page-subtitle" style={{ margin: 0 }}>
                      Default: 40 min
                    </span>
                  </div>

                  <div className="play-actions">
                    <button
                      type="button"
                      className="btn btn--accent btn--lg"
                      onClick={handleStartTimer}
                      disabled={!selectedBook}
                    >
                      Let&apos;s start
                    </button>
                  </div>
                </>
              )}

              {(timerRunning || phase === 'finished') && (
                <div className="reading-session">
                  <div className="timer-section">
                    <CircularTimer
                      remainingSeconds={remainingSeconds}
                      totalSeconds={totalSeconds}
                      running={timerRunning}
                    />
                    {selectedBook && (
                      <p className="page-subtitle" style={{ textAlign: 'center' }}>
                        Reading: <strong>{selectedBook.title}</strong>
                      </p>
                    )}
                    {timerRunning && (
                      <div className="play-actions" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() => setShowFinishModal(true)}
                        >
                          Finish early
                        </button>
                      </div>
                    )}
                    {phase === 'finished' && (
                      <div className="play-actions" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn btn--primary"
                          onClick={handleGoToReview}
                        >
                          Let&apos;s review
                        </button>
                      </div>
                    )}
                  </div>

                  {(timerRunning || phase === 'finished') && selectedBook?.key && (
                    <BookReader previewUrl={previewUrl} />
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>

        <RosterPanel participants={participants} />
      </div>

      {source === 'mock' && (
        <p className="page-subtitle" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          Using demo books — upload a PDF with <code>scripts/upload_book.sh</code> and
          ensure the API can reach S3.
        </p>
      )}

      <RouletteModal open={phase === 'roulette'}>
        <Roulette />
      </RouletteModal>

      <ConfirmFinishModal
        open={showFinishModal}
        onConfirm={handleConfirmFinishEarly}
        onDismiss={() => setShowFinishModal(false)}
      />

      <TimeUpModal
        open={showModal}
        endedEarly={endedEarly}
        onGoToReview={handleGoToReview}
        onDismiss={() => {
          setShowModal(false);
          setModalDismissed(true);
        }}
      />
    </section>
  );
}
