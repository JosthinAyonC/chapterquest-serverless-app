export type AppEnvironment = 'prod' | 'dev' | 'local';

export function getAppEnvironment(): AppEnvironment {
  const env = import.meta.env.VITE_APP_ENV;
  if (env === 'prod' || env === 'dev' || env === 'local') {
    return env;
  }
  if (import.meta.env.DEV) {
    return 'local';
  }
  return 'prod';
}

export function getEnvironmentBadgeLabel(
  environment: AppEnvironment,
): string | null {
  switch (environment) {
    case 'prod':
      return null;
    case 'dev':
      return 'Test environment';
    case 'local':
      return 'Local dev';
  }
}

/** Override reading timer to N seconds — only when VITE_APP_ENV=local. */
export function getDevTimerSeconds(): number | null {
  if (getAppEnvironment() !== 'local') return null;
  const raw = import.meta.env.VITE_DEV_TIMER_SECONDS;
  if (!raw) return null;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}
