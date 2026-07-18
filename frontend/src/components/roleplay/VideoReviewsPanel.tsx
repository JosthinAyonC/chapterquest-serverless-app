import { useEffect, useState } from 'react';
import { getRoleById } from '../../data/roles';
import type { RoleId } from '../../types/role';
import {
  HOST_VIDEOS_EMPTY,
  HOST_VIDEOS_ERROR,
  HOST_VIDEOS_LOADING,
} from '../../lib/roleplay/copy';
import { loadSessionVideos, type SessionVideoItem } from '../../lib/roleplay/session';
import ReviewVideoPlayer from './ReviewVideoPlayer';

export interface VideoReviewsPanelProps {
  sessionCode: string;
}

function sameVideoRoster(a: SessionVideoItem[], b: SessionVideoItem[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (item, index) =>
      item.participantName === b[index]?.participantName &&
      item.uploadedAt === b[index]?.uploadedAt,
  );
}

function mergeVideoUrls(
  previous: SessionVideoItem[],
  incoming: SessionVideoItem[],
): SessionVideoItem[] {
  return incoming.map((item) => {
    const existing = previous.find(
      (video) =>
        video.participantName === item.participantName &&
        video.uploadedAt === item.uploadedAt,
    );
    return existing ? { ...item, url: existing.url } : item;
  });
}

export default function VideoReviewsPanel({ sessionCode }: VideoReviewsPanelProps) {
  const [videos, setVideos] = useState<SessionVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async (isInitial: boolean) => {
      try {
        const items = await loadSessionVideos(sessionCode);
        if (cancelled) return;

        setVideos((previous) => {
          if (isInitial || !sameVideoRoster(previous, items)) {
            return items;
          }
          return mergeVideoUrls(previous, items);
        });
        setError('');
      } catch {
        if (!cancelled) {
          setVideos([]);
          setError(HOST_VIDEOS_ERROR);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load(true);
    const id = window.setInterval(() => void load(false), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessionCode]);

  if (loading) {
    return <p className="page-subtitle">{HOST_VIDEOS_LOADING}</p>;
  }

  if (error) {
    return <p className="form-error">{error}</p>;
  }

  if (videos.length === 0) {
    return <p className="page-subtitle">{HOST_VIDEOS_EMPTY}</p>;
  }

  return (
    <div className="video-reviews-panel">
      {videos.map((video) => {
        const role = getRoleById(video.roleId as RoleId);
        return (
          <article
            key={video.participantName}
            className="video-review-card"
          >
            <header className="video-review-card-header">
              <h3>{video.participantName}</h3>
              {role ? (
                <p className="video-review-card-role">
                  {role.icon} {role.nameEn}
                </p>
              ) : null}
            </header>
            <ReviewVideoPlayer
              src={video.url}
              title={`${video.participantName} review`}
            />
          </article>
        );
      })}
    </div>
  );
}
