import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { jsonResponse } from '../../common/http';
import { logger } from '../../common/logger';
import { LibraryService } from '../services/library.service';

let libraryService: LibraryService | undefined;

function getLibraryService(): LibraryService {
  libraryService ??= new LibraryService();
  return libraryService;
}

export async function handler(event: APIGatewayProxyEventV2) {
  logger.info('Library handler invoked', {
    routeKey: event.routeKey,
    requestId: event.requestContext?.requestId,
  });

  try {
    if (event.routeKey === 'GET /library') {
      const books = await getLibraryService().listCatalog();
      return jsonResponse(200, { books });
    }

    if (event.routeKey === 'GET /library/{key}/preview-url') {
      const key = event.pathParameters?.key;
      if (!key) {
        return jsonResponse(400, {
          error: 'validation_error',
          message: 'Book key is required.',
        });
      }

      const { url, expiresIn } = await getLibraryService().getPreviewUrl(key);
      return jsonResponse(200, { url, expiresIn });
    }

    return jsonResponse(404, {
      error: 'not_found',
      message: 'Ruta no encontrada.',
    });
  } catch (error) {
    logger.info('Library handler error', {
      routeKey: event.routeKey,
      error: error instanceof Error ? error.message : String(error),
    });

    if (isNotFoundError(error)) {
      return jsonResponse(404, {
        error: 'not_found',
        message: 'Book not found in library.',
      });
    }

    return jsonResponse(500, {
      error: 'internal_error',
      message: 'Could not load library catalog.',
    });
  }
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'NotFound'
  );
}
