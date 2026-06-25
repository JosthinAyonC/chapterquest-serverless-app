const GUEST_COOKIE_NAME = 'litcircle_guest_name';
const COOKIE_MAX_AGE_DAYS = 365;

export function readGuestCookie(): string | null {
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${GUEST_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`,
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function writeGuestCookie(username: string): void {
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${GUEST_COOKIE_NAME}=${encodeURIComponent(username)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function deleteGuestCookie(): void {
  document.cookie = `${GUEST_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
