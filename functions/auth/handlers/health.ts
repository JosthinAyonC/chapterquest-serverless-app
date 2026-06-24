import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { jsonResponse } from '../../common/http';
import { logger } from '../../common/logger';
import { HealthService } from '../services/health.service';

const healthService = new HealthService();

export async function handler(event: APIGatewayProxyEventV2) {
  logger.info('Health check invoked', {
    requestId: event.requestContext?.requestId,
  });

  const status = healthService.getStatus();
  return jsonResponse(200, status);
}
