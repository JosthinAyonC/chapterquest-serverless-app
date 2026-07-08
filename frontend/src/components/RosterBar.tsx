import { motion } from 'framer-motion';
import { getRoleById } from '../data/roles';
import { usePlaySession } from '../context/PlaySessionContext';

export default function RosterBar() {
  const { hasActiveSession, participants } = usePlaySession();

  if (!hasActiveSession || participants.length === 0) return null;

  return (
    <aside className="roster-bar" aria-label="Roster de participantes">
      <div className="container roster-bar-inner">
        <span className="roster-label">Roster</span>
        <div className="roster-chips" role="list">
          {participants.map((p) => {
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
