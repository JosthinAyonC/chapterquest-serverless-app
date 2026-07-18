import type { RoleId } from '../../types/role';

function slugifySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDownloadStamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export function buildReviewDownloadFilename(
  participantName: string,
  roleId: RoleId,
  date = new Date(),
): string {
  const name = slugifySegment(participantName) || 'student';
  const role = slugifySegment(roleId);
  const stamp = formatDownloadStamp(date);
  return `${name}-${role}-review-${stamp}.pdf`;
}
