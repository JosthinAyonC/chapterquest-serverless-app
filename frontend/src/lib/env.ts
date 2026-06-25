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
