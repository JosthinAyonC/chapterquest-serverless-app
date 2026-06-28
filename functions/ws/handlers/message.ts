import type { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { logger } from '../../common/logger';

export async function handler(event: APIGatewayProxyWebsocketEventV2) {
  logger.info('WebSocket message', {
    connectionId: event.requestContext.connectionId,
    body: event.body,
  });

  return { statusCode: 200, body: 'Acknowledged' };
}
