import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import HostReviewBook, { type HostReviewBookPage } from '../components/roleplay/HostReviewBook';
import { useHostReview } from '../context/HostReviewContext';
import { usePlaySession } from '../context/PlaySessionContext';
import RoleplayQrPanel from '../components/roleplay/RoleplayQrPanel';
import VideoReviewsPanel from '../components/roleplay/VideoReviewsPanel';
import {
  HOST_TAB_INSTRUCTIONS,
  HOST_TAB_VIDEOS,
  ROLEPLAY_HOST_STEPS,
  ROLE_REVIEW_OBJECTIVE,
  ROLE_REVIEW_OBJECTIVE_TITLE,
} from '../lib/roleplay/copy';
import { isHostReviewRegistered } from '../lib/roleplay/host-reviews';
import {
  buildRoleplayPlayerUrl,
  getOrCreatePendingHostCode,
  loadPublishedSession,
  publishRoleplaySession,
} from '../lib/roleplay/session';

export default function ReviewHostPage() {
  const { code: codeParam } = useParams();
  const navigate = useNavigate();
  const { participants, selectedBook } = usePlaySession();
  const { hostSession, setHostSession } = useHostReview();
  const publishedRef = useRef(false);

  const isRecoveryRoute = Boolean(codeParam);
  const sessionCode = useMemo(
    () => (codeParam ? codeParam.trim().toUpperCase() : getOrCreatePendingHostCode()),
    [codeParam],
  );

  const [accessDenied, setAccessDenied] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(isRecoveryRoute);
  const [activeTab, setActiveTab] = useState<HostReviewBookPage>('instructions');

  useEffect(() => {
    if (!isRecoveryRoute) return;

    if (!isHostReviewRegistered(sessionCode)) {
      setAccessDenied(true);
      setHostSession(null);
      setSessionLoading(false);
      return;
    }

    setAccessDenied(false);
    let cancelled = false;
    setSessionLoading(true);

    void loadPublishedSession(sessionCode)
      .then((session) => {
        if (cancelled) return;
        if (session) {
          setHostSession(session);
          localStorage.setItem('litcircle:active-roleplay-code', session.code);
        } else {
          setAccessDenied(true);
          setHostSession(null);
        }
      })
      .finally(() => {
        if (!cancelled) setSessionLoading(false);
      });

    return () => {
      cancelled = true;
      setHostSession(null);
    };
  }, [isRecoveryRoute, sessionCode, setHostSession]);

  useEffect(() => {
    if (isRecoveryRoute) return;
    if (participants.length === 0) {
      navigate('/play', { replace: true });
      return;
    }

    if (isHostReviewRegistered(sessionCode)) {
      publishedRef.current = true;
      navigate(`/review/host/${sessionCode}`, { replace: true });
      return;
    }

    if (publishedRef.current) return;

    let cancelled = false;

    void (async () => {
      try {
        const session = await publishRoleplaySession({
          code: sessionCode,
          book: selectedBook,
          participants: participants.map((p) => ({
            name: p.name,
            roleId: p.roleId,
          })),
        });
        if (!cancelled) {
          publishedRef.current = true;
          navigate(`/review/host/${session.code}`, { replace: true });
        }
      } catch {
        if (!cancelled) publishedRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isRecoveryRoute, navigate, participants, selectedBook, sessionCode]);

  const activeSession = isRecoveryRoute ? hostSession : null;
  const rosterSize = isRecoveryRoute
    ? (activeSession?.participants.length ?? 0)
    : participants.length;
  const finalizedCount = activeSession?.finalizedNames.length ?? 0;

  const playerUrl = buildRoleplayPlayerUrl(sessionCode);

  const instructionsContent = (
    <>
      <h3>{ROLE_REVIEW_OBJECTIVE_TITLE}</h3>
      <p className="roleplay-host-intro">{ROLE_REVIEW_OBJECTIVE}</p>

      <h3>How to join</h3>
      <ol className="roleplay-host-steps">
        {ROLEPLAY_HOST_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <p className="roleplay-host-progress">
        Finished: <strong>{finalizedCount}</strong> / {rosterSize || 6}
      </p>
    </>
  );

  if (!isRecoveryRoute && !publishedRef.current) {
    return (
      <section className="page">
        <header className="page-header">
          <p className="eyebrow">Role review</p>
          <h1>Starting review session…</h1>
        </header>
      </section>
    );
  }

  if (accessDenied) {
    return (
      <section className="page">
        <header className="page-header">
          <p className="eyebrow">Role review</p>
          <h1>Session not available</h1>
          <p className="page-subtitle">
            This review is not saved on this device. Open it from{' '}
            <strong>My reviews</strong> or start a new circle from Play.
          </p>
        </header>
        <Link to="/play" className="btn btn--primary">
          Go to Play
        </Link>
      </section>
    );
  }

  if (isRecoveryRoute && sessionLoading) {
    return (
      <section className="page">
        <header className="page-header">
          <p className="eyebrow">Role review</p>
          <h1>Loading review session…</h1>
        </header>
      </section>
    );
  }

  return (
    <section className="page roleplay-host-page">
      <motion.header
        className="page-header roleplay-host-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="eyebrow">Role review</p>
        <h1>Let&apos;s complete our reviews</h1>
      </motion.header>

      <HostReviewBook
        tabs={[
          { id: 'instructions', label: HOST_TAB_INSTRUCTIONS },
          { id: 'videos', label: HOST_TAB_VIDEOS },
        ]}
        activePage={activeTab}
        onPageChange={setActiveTab}
        joinPanel={<RoleplayQrPanel url={playerUrl} code={sessionCode} />}
        instructions={instructionsContent}
        videos={<VideoReviewsPanel sessionCode={sessionCode} />}
      />
    </section>
  );
}
