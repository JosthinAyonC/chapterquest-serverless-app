import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { jsonResponse, parseBody } from '../../common/http';
import { logger } from '../../common/logger';
import {
  GuestService,
  GuestValidationError,
} from '../services/guest.service';

const guestService = new GuestService();

interface GuestRequestBody {
  username: string;
}

export async function handler(event: APIGatewayProxyEventV2) {
  logger.info('Register guest invoked', {
    requestId: event.requestContext?.requestId,
  });

  const body = parseBody<GuestRequestBody>(event);
  if (!body?.username) {
    return jsonResponse(400, {
      error: 'validation_error',
      message: 'Se requiere el campo username.',
    });
  }

  try {
    const result = await guestService.registerGuest(body.username);

    if (result.status === 'conflict') {
      return jsonResponse(409, {
        error: 'username_taken',
        message: 'Este nombre ya está en uso. Elige otro.',
      });
    }

    return jsonResponse(201, {
      username: result.profile.username,
      type: result.profile.type,
      createdAt: result.profile.createdAt,
    });
  } catch (error) {
    if (error instanceof GuestValidationError) {
      return jsonResponse(400, {
        error: 'validation_error',
        message: error.message,
      });
    }

    if (error instanceof ConditionalCheckFailedException) {
      return jsonResponse(409, {
        error: 'username_taken',
        message: 'Este nombre ya está en uso. Elige otro.',
      });
    }

    logger.error('Register guest failed', { error });
    return jsonResponse(500, {
      error: 'internal_error',
      message: 'No se pudo registrar el invitado.',
    });
  }
}
