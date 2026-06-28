import type { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { logger } from '../../common/logger';

export async function handler(event: APIGatewayProxyWebsocketEventV2) {
  logger.info('WebSocket disconnect', {
    connectionId: event.requestContext.connectionId,
  });

  return { statusCode: 200, body: 'Disconnected' };
}
