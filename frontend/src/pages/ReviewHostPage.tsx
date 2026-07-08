import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { usePlaySession } from '../context/PlaySessionContext';
import RoleplayQrPanel from '../components/roleplay/RoleplayQrPanel';
import {
  ROLEPLAY_HOST_STEPS,
  ROLE_REVIEW_BODY,
  ROLE_REVIEW_OBJECTIVE,
  ROLE_REVIEW_OBJECTIVE_TITLE,
  ROLE_REVIEW_TITLE,
} from '../lib/roleplay/copy';
import {
  buildRoleplayPlayerUrl,
  generateSessionCode,
  getActiveRoleplayCode,
  loadPublishedSession,
  publishRoleplaySession,
} from '../lib/roleplay/session';

export default function ReviewHostPage() {
  const { participants, selectedBook } = usePlaySession();
  const publishedRef = useRef(false);

  const sessionCode = useMemo(() => getActiveRoleplayCode() ?? generateSessionCode(), []);

  useEffect(() => {
    if (publishedRef.current || participants.length === 0) return;

    let cancelled = false;

    void (async () => {
      try {
        await publishRoleplaySession({
          code: sessionCode,
          book: selectedBook,
          participants: participants.map((p) => ({
            name: p.name,
            roleId: p.roleId,
          })),
        });
      } finally {
        if (!cancelled) publishedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [participants, selectedBook, sessionCode]);

  const playerUrl = buildRoleplayPlayerUrl(sessionCode);
  const [finalizedCount, setFinalizedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const current = await loadPublishedSession(sessionCode);
      if (!cancelled) setFinalizedCount(current?.finalizedNames.length ?? 0);
    };

    void refresh();
    const id = window.setInterval(() => void refresh(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessionCode]);

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

      <div className="roleplay-host-layout">
        <RoleplayQrPanel url={playerUrl} code={sessionCode} />

        <aside className="roleplay-host-guide play-panel">
          <h2>{ROLE_REVIEW_TITLE}</h2>
          <p className="roleplay-host-intro">{ROLE_REVIEW_BODY}</p>

          <h3>{ROLE_REVIEW_OBJECTIVE_TITLE}</h3>
          <p className="roleplay-host-intro">{ROLE_REVIEW_OBJECTIVE}</p>

          <h3>How to join</h3>
          <ol className="roleplay-host-steps">
            {ROLEPLAY_HOST_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <p className="roleplay-host-progress">
            Finished: <strong>{finalizedCount}</strong> / {participants.length || 6}
          </p>
        </aside>
      </div>
    </section>
  );
}
