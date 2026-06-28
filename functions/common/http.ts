import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

export interface ApiResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export function jsonResponse(
  statusCode: number,
  data: unknown,
  extraHeaders?: Record<string, string>,
): ApiResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
    body: JSON.stringify(data),
  };
}

export function parseBody<T>(event: APIGatewayProxyEventV2): T | null {
  if (!event.body) return null;
  try {
    return JSON.parse(event.body) as T;
  } catch {
    return null;
  }
}

export function notImplemented(feature: string): ApiResponse {
  return jsonResponse(501, {
    error: 'not_implemented',
    message: `${feature} — planned for an upcoming iteration.`,
  });
}

export type LambdaResult = APIGatewayProxyResultV2;
