import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { jsonResponse, notImplemented } from '../../common/http';
import { logger } from '../../common/logger';

export async function handler(event: APIGatewayProxyEventV2) {
  logger.info('Sessions handler invoked', {
    routeKey: event.routeKey,
    requestId: event.requestContext?.requestId,
  });

  switch (event.routeKey) {
    case 'POST /sessions':
      return notImplemented('Create role-play activity');
    case 'GET /sessions/{sessionId}':
      return notImplemented('Get activity');
    case 'PATCH /sessions/{sessionId}':
      return notImplemented('Update activity / timer');
    case 'POST /sessions/{sessionId}/close':
      return notImplemented('Close activity');
    case 'POST /sessions/{sessionId}/reviews/claim':
      return notImplemented('Claim participant for review');
    case 'POST /sessions/{sessionId}/reviews':
      return notImplemented('Submit session review');
    case 'GET /sessions/{sessionId}/export':
      return notImplemented('Export session report');
    case 'GET /sessions/by-code/{accessCode}':
      return notImplemented('Resolve session by access code');
    default:
      return jsonResponse(404, {
        error: 'not_found',
        message: 'Ruta no encontrada.',
      });
  }
}
