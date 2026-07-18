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
  bookKey?: string | null;
  coverUrl?: string | null;
  participants: Array<{ name: string; roleId: string }>;
}

interface FinalizeRoleplayBody {
  participantName: string;
  videoKey?: string;
  videoContentType?: string;
}

interface VideoUploadUrlBody {
  participantName: string;
  contentType: string;
  sizeBytes: number;
}

const roleplayService = new RoleplaySessionService();

function toApiSession(session: {
  code: string;
  createdAt: string;
  bookTitle: string | null;
  bookKey: string | null;
  coverUrl: string | null;
  participants: Array<{ name: string; roleId: string }>;
  finalizedNames: string[];
}) {
  return {
    code: session.code,
    createdAt: session.createdAt,
    bookTitle: session.bookTitle,
    bookKey: session.bookKey,
    coverUrl: session.coverUrl,
    participants: session.participants,
    finalizedNames: session.finalizedNames,
  };
}

function handleRoleplayError(error: unknown): ReturnType<typeof jsonResponse> | null {
  if (error instanceof RoleplaySessionError) {
    const status = error.code === 'not_found' ? 404 : 400;
    return jsonResponse(status, {
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
          bookKey: body.bookKey ?? null,
          coverUrl: body.coverUrl ?? null,
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
          body.videoKey,
        );
        if (!session) {
          return jsonResponse(404, {
            error: 'not_found',
            message: 'Role review session not found.',
          });
        }
        return jsonResponse(200, { session: toApiSession(session) });
      }
      case 'POST /sessions/by-code/{accessCode}/videos/upload-url': {
        const accessCode = event.pathParameters?.accessCode;
        const body = parseBody<VideoUploadUrlBody>(event);
        if (
          !accessCode ||
          !body?.participantName ||
          !body.contentType ||
          !Number.isFinite(body.sizeBytes)
        ) {
          return jsonResponse(400, {
            error: 'invalid_request',
            message: 'accessCode, participantName, contentType, and sizeBytes are required.',
          });
        }
        const result = await roleplayService.createVideoUploadUrl({
          accessCode,
          participantName: body.participantName,
          contentType: body.contentType,
          sizeBytes: body.sizeBytes,
        });
        return jsonResponse(200, result);
      }
      case 'GET /sessions/by-code/{accessCode}/videos': {
        const accessCode = event.pathParameters?.accessCode;
        if (!accessCode) {
          return jsonResponse(400, {
            error: 'invalid_request',
            message: 'accessCode is required.',
          });
        }
        const videos = await roleplayService.listSessionVideos(accessCode);
        return jsonResponse(200, { videos });
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
