import { describe, expect, it } from 'vitest';
import { HealthService } from '../services/health.service';

describe('HealthService', () => {
  it('returns healthy status', () => {
    const service = new HealthService();
    expect(service.getStatus()).toEqual({
      service: 'chapterquest-api',
      status: 'healthy',
    });
  });
});
