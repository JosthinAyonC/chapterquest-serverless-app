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

export default function VideoReviewsPanel({ sessionCode }: VideoReviewsPanelProps) {
  const [videos, setVideos] = useState<SessionVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    void loadSessionVideos(sessionCode)
      .then((items) => {
        if (cancelled) return;
        setVideos(items);
        setError('');
      })
      .catch(() => {
        if (!cancelled) {
          setVideos([]);
          setError(HOST_VIDEOS_ERROR);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
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
          <article key={video.participantName} className="video-review-card">
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
