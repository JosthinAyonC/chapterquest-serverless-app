import { getRoleById } from '../../data/roles';
import {
  formatReviewCreatedAt,
  getHostReviewStatus,
  HOST_REVIEW_STATUS_LABEL,
} from '../../lib/roleplay/host-review-status';
import type { PublishedRoleplaySession } from '../../lib/roleplay/session';

interface MyReviewCardProps {
  session: PublishedRoleplaySession;
  onSelect: () => void;
}

export default function MyReviewCard({ session, onSelect }: MyReviewCardProps) {
  const status = getHostReviewStatus(session);

  return (
    <button type="button" className="my-review-card" onClick={onSelect}>
      <div className="my-review-card-roster">
        <span className="my-review-card-roster-label">Roster</span>
        <div className="my-review-card-roster-chips">
          {session.participants.map((p) => {
            const role = getRoleById(p.roleId);
            return (
              <span key={p.name} className="my-review-card-roster-chip">
                <span
                  className="my-review-card-roster-dot"
                  style={{ background: role.color }}
                  aria-hidden="true"
                />
                {p.name} · {role.nameEn}
              </span>
            );
          })}
        </div>
      </div>

      <div className="my-review-card-body">
        <div className="my-review-card-book">
          {session.coverUrl ? (
            <img
              className="my-review-card-cover-img"
              src={session.coverUrl}
              alt=""
            />
          ) : (
            <span className="my-review-card-cover-fallback" aria-hidden="true" />
          )}
          <div className="my-review-card-book-text">
            <span className="my-review-card-book-label">Review for</span>
            <span className="my-review-card-book-title">
              {session.bookTitle ?? 'No book linked'}
            </span>
            <span className="my-review-card-date">
              {formatReviewCreatedAt(session.createdAt)}
            </span>
          </div>
        </div>

        <div className="my-review-card-meta">
          <span
            className={`my-review-card-status my-review-card-status--${status}`}
          >
            {HOST_REVIEW_STATUS_LABEL[status]}
          </span>
          <span className="my-review-card-code">{session.code}</span>
        </div>
      </div>
    </button>
  );
}
