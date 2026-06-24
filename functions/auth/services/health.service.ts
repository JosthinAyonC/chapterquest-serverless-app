import type { HealthStatus } from '../../common/models';

export class HealthService {
  getStatus(): HealthStatus {
    return {
      service: 'chapterquest-api',
      status: 'healthy',
    };
  }
}
