import type { PublishedRoleplaySession } from './session';

export type HostReviewStatus = 'in_progress' | 'completed';

export function getHostReviewStatus(
  session: PublishedRoleplaySession,
): HostReviewStatus {
  const total = session.participants.length;
  if (total === 0) return 'in_progress';
  return session.finalizedNames.length >= total ? 'completed' : 'in_progress';
}

export function formatReviewCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const HOST_REVIEW_STATUS_LABEL: Record<HostReviewStatus, string> = {
  in_progress: 'In progress',
  completed: 'Completed',
};
