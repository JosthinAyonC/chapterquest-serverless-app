export const COOKIE_CONSENT_KEY = 'litcircle:cookie-consent';

export function hasCookieConsent(): boolean {
  return localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted';
}

export function acceptCookieConsent(): void {
  localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
}
