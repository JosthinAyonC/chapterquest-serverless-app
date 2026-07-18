import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { getRoleById } from '../data/roles';
import { useHostReview } from '../context/HostReviewContext';
import { usePlaySession } from '../context/PlaySessionContext';

export default function RosterBar() {
  const { pathname } = useLocation();
  const { participants } = usePlaySession();
  const { hostSession } = useHostReview();

  const isHostReviewRoute = pathname.startsWith('/review/host');
  const rosterParticipants =
    participants.length > 0
      ? participants
      : isHostReviewRoute && hostSession
        ? hostSession.participants
        : [];

  if (rosterParticipants.length === 0) return null;

  return (
    <aside className="roster-bar" aria-label="Roster de participantes">
      <div className="container roster-bar-inner">
        <span className="roster-label">Roster</span>
        <div className="roster-chips" role="list">
          {rosterParticipants.map((p) => {
            const role = getRoleById(p.roleId);
            return (
              <motion.span
                key={p.name}
                className="roster-chip"
                role="listitem"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
              >
                <span
                  className="roster-chip-dot"
                  style={{ background: role.color }}
                  aria-hidden="true"
                />
                {p.name} · {role.nameEn}
              </motion.span>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
