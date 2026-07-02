import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

const { listCatalogMock, getPreviewUrlMock } = vi.hoisted(() => ({
  listCatalogMock: vi.fn(),
  getPreviewUrlMock: vi.fn(),
}));

vi.mock('../services/library.service', () => ({
  LibraryService: vi.fn().mockImplementation(() => ({
    listCatalog: listCatalogMock,
    getPreviewUrl: getPreviewUrlMock,
  })),
}));

import { handler } from './list';

function buildEvent(
  routeKey: string,
  pathParameters?: Record<string, string>,
): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey,
    rawPath: '/library',
    rawQueryString: '',
    headers: {},
    pathParameters,
    requestContext: {
      accountId: 'test',
      apiId: 'test',
      domainName: 'localhost',
      domainPrefix: 'local',
      http: {
        method: 'GET',
        path: '/library',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'vitest',
      },
      requestId: 'test-request',
      routeKey,
      stage: 'dev',
      time: '2026-01-01T00:00:00Z',
      timeEpoch: 0,
    },
    isBase64Encoded: false,
  };
}

describe('library handler', () => {
  beforeEach(() => {
    listCatalogMock.mockReset();
    getPreviewUrlMock.mockReset();
  });

  it('returns catalog on GET /library', async () => {
    listCatalogMock.mockResolvedValue([
      {
        key: 'el-pepe.pdf',
        title: 'El pepe',
        author: 'j wild',
        language: 'EN',
        description: 'desc',
        coverUrl: 'https://signed.example/cover.png',
      },
    ]);

    const result = await handler(buildEvent('GET /library'));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      books: [
        {
          key: 'el-pepe.pdf',
          title: 'El pepe',
          author: 'j wild',
          language: 'EN',
          description: 'desc',
          coverUrl: 'https://signed.example/cover.png',
        },
      ],
    });
  });

  it('returns preview url on GET /library/{key}/preview-url', async () => {
    getPreviewUrlMock.mockResolvedValue('https://signed.example/book.pdf');

    const result = await handler(
      buildEvent('GET /library/{key}/preview-url', { key: 'el-pepe.pdf' }),
    );
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      url: 'https://signed.example/book.pdf',
      expiresIn: 300,
    });
  });

  it('returns 400 when preview key is missing', async () => {
    const result = await handler(
      buildEvent('GET /library/{key}/preview-url'),
    );
    expect(result.statusCode).toBe(400);
  });
});
