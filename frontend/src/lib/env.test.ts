import { describe, expect, it } from 'vitest';
import { getEnvironmentBadgeLabel } from './env';

describe('getEnvironmentBadgeLabel', () => {
  it('returns null for production', () => {
    expect(getEnvironmentBadgeLabel('prod')).toBeNull();
  });

  it('returns test label for dev', () => {
    expect(getEnvironmentBadgeLabel('dev')).toBe('Test environment');
  });

  it('returns local label for local', () => {
    expect(getEnvironmentBadgeLabel('local')).toBe('Local dev');
  });
});
