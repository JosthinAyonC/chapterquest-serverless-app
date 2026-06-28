import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { jsonResponse, notImplemented } from '../../common/http';
import { logger } from '../../common/logger';

export async function handler(event: APIGatewayProxyEventV2) {
  logger.info('Library handler invoked', {
    routeKey: event.routeKey,
    requestId: event.requestContext?.requestId,
  });

  if (event.routeKey === 'GET /library') {
    return notImplemented('Library catalog');
  }

  if (event.routeKey === 'GET /library/{key}/preview-url') {
    return notImplemented('Library PDF preview URL');
  }

  return jsonResponse(404, {
    error: 'not_found',
    message: 'Ruta no encontrada.',
  });
}
