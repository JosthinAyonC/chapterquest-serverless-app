const MY_REVIEWS_KEY = 'litcircle:my-reviews';
export const PENDING_HOST_CODE_KEY = 'litcircle:pending-host-code';
export const MY_REVIEWS_CHANGED_EVENT = 'litcircle:my-reviews-changed';

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function getHostReviewCodes(): string[] {
  const raw = localStorage.getItem(MY_REVIEWS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.map((code) => normalizeCode(String(code)))
      : [];
  } catch {
    return [];
  }
}

export function registerHostReview(code: string): void {
  const normalized = normalizeCode(code);
  const codes = getHostReviewCodes();
  if (codes.includes(normalized)) return;
  localStorage.setItem(MY_REVIEWS_KEY, JSON.stringify([normalized, ...codes]));
  window.dispatchEvent(new Event(MY_REVIEWS_CHANGED_EVENT));
}

export function isHostReviewRegistered(code: string): boolean {
  return getHostReviewCodes().includes(normalizeCode(code));
}

export function clearPendingHostCode(): void {
  sessionStorage.removeItem(PENDING_HOST_CODE_KEY);
}
