import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

const { registerGuestMock } = vi.hoisted(() => ({
  registerGuestMock: vi.fn(),
}));

vi.mock('../services/guest.service', () => ({
  GuestService: vi.fn().mockImplementation(() => ({
    registerGuest: registerGuestMock,
  })),
  GuestValidationError: class GuestValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'GuestValidationError';
    }
  },
}));

import { GuestValidationError } from '../services/guest.service';
import { handler } from './guest';

function buildEvent(body: unknown): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'POST /users/guest',
    rawPath: '/users/guest',
    rawQueryString: '',
    headers: {},
    requestContext: {
      accountId: 'test',
      apiId: 'test',
      domainName: 'localhost',
      domainPrefix: 'local',
      http: {
        method: 'POST',
        path: '/users/guest',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'vitest',
      },
      requestId: 'test-request',
      routeKey: 'POST /users/guest',
      stage: 'dev',
      time: '2026-01-01T00:00:00Z',
      timeEpoch: 0,
    },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
}

describe('guest handler', () => {
  beforeEach(() => {
    registerGuestMock.mockReset();
  });

  it('returns 400 when username is missing', async () => {
    const result = await handler(buildEvent({}));
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toMatchObject({
      error: 'validation_error',
    });
  });

  it('returns 201 when guest is created', async () => {
    registerGuestMock.mockResolvedValue({
      status: 'created',
      profile: {
        username: 'lector',
        type: 'guest',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });

    const result = await handler(buildEvent({ username: 'lector' }));
    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body)).toEqual({
      username: 'lector',
      type: 'guest',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('returns 409 when username is taken', async () => {
    registerGuestMock.mockResolvedValue({ status: 'conflict' });

    const result = await handler(buildEvent({ username: 'ocupado' }));
    expect(result.statusCode).toBe(409);
    expect(JSON.parse(result.body)).toMatchObject({
      error: 'username_taken',
    });
  });

  it('returns 400 on validation error', async () => {
    registerGuestMock.mockRejectedValue(
      new GuestValidationError('Solo letras minúsculas, números y guión bajo.'),
    );

    const result = await handler(buildEvent({ username: 'bad name' }));
    expect(result.statusCode).toBe(400);
  });
});
