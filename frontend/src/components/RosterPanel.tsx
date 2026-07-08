import { getRoleById } from '../data/roles';
import type { Participant } from '../context/PlaySessionContext';

interface RosterPanelProps {
  participants: Participant[];
  title?: string;
}

export default function RosterPanel({
  participants,
  title = 'Your circle',
}: RosterPanelProps) {
  if (participants.length === 0) {
    return (
      <div className="play-panel roster-panel">
        <h2>{title}</h2>
        <p className="page-subtitle">Assign roles to see the roster here.</p>
      </div>
    );
  }

  return (
    <div className="play-panel roster-panel">
      <h2>{title}</h2>
      <ul className="roster-list" aria-label="Participant roster">
        {participants.map((p) => {
          const role = getRoleById(p.roleId);
          return (
            <li
              key={p.name}
              className="roster-item"
              style={{ '--role-color': role.color } as React.CSSProperties}
            >
              <span className="roster-item-name">{p.name}</span>
              <span className="roster-item-role">{role.nameEn}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
