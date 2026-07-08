import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { jsonResponse, parseBody } from '../../common/http';
import { logger } from '../../common/logger';
import {
  RoleplaySessionError,
  RoleplaySessionService,
} from '../services/roleplay-session.service';

interface PublishRoleplayBody {
  code: string;
  bookTitle?: string | null;
  participants: Array<{ name: string; roleId: string }>;
}

interface FinalizeRoleplayBody {
  participantName: string;
}

const roleplayService = new RoleplaySessionService();

function toApiSession(session: {
  code: string;
  createdAt: string;
  bookTitle: string | null;
  participants: Array<{ name: string; roleId: string }>;
  finalizedNames: string[];
}) {
  return {
    code: session.code,
    createdAt: session.createdAt,
    bookTitle: session.bookTitle,
    participants: session.participants,
    finalizedNames: session.finalizedNames,
  };
}

function handleRoleplayError(error: unknown): ReturnType<typeof jsonResponse> | null {
  if (error instanceof RoleplaySessionError) {
    return jsonResponse(400, {
      error: error.code,
      message: error.message,
    });
  }
  logger.error('Roleplay session error', {
    message: error instanceof Error ? error.message : String(error),
  });
  return jsonResponse(500, {
    error: 'internal_error',
    message: 'Could not process the role review session.',
  });
}

export async function handler(event: APIGatewayProxyEventV2) {
  logger.info('Sessions handler invoked', {
    routeKey: event.routeKey,
    requestId: event.requestContext?.requestId,
  });

  try {
    switch (event.routeKey) {
      case 'POST /sessions': {
        const body = parseBody<PublishRoleplayBody>(event);
        if (!body?.code || !Array.isArray(body.participants) || body.participants.length === 0) {
          return jsonResponse(400, {
            error: 'invalid_request',
            message: 'code and participants are required.',
          });
        }
        const session = await roleplayService.publish({
          code: body.code,
          bookTitle: body.bookTitle ?? null,
          participants: body.participants,
        });
        return jsonResponse(200, { session: toApiSession(session) });
      }
      case 'GET /sessions/by-code/{accessCode}': {
        const accessCode = event.pathParameters?.accessCode;
        if (!accessCode) {
          return jsonResponse(400, {
            error: 'invalid_request',
            message: 'accessCode is required.',
          });
        }
        const session = await roleplayService.getByAccessCode(accessCode);
        if (!session) {
          return jsonResponse(404, {
            error: 'not_found',
            message: 'Role review session not found.',
          });
        }
        return jsonResponse(200, { session: toApiSession(session) });
      }
      case 'POST /sessions/by-code/{accessCode}/finalize': {
        const accessCode = event.pathParameters?.accessCode;
        const body = parseBody<FinalizeRoleplayBody>(event);
        if (!accessCode || !body?.participantName) {
          return jsonResponse(400, {
            error: 'invalid_request',
            message: 'accessCode and participantName are required.',
          });
        }
        const session = await roleplayService.finalizeParticipant(
          accessCode,
          body.participantName,
        );
        if (!session) {
          return jsonResponse(404, {
            error: 'not_found',
            message: 'Role review session not found.',
          });
        }
        return jsonResponse(200, { session: toApiSession(session) });
      }
      default:
        return jsonResponse(404, {
          error: 'not_found',
          message: 'Ruta no encontrada.',
        });
    }
  } catch (error) {
    return handleRoleplayError(error) ?? jsonResponse(500, {
      error: 'internal_error',
      message: 'Unexpected error.',
    });
  }
}
