import express from 'express';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler as healthHandler } from '../auth/handlers/health';

const app = express();
const PORT = Number(process.env.LOCAL_API_PORT ?? 3001);

app.use(express.json());

function toApiGatewayEvent(
  req: express.Request,
): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: `${req.method} ${req.path}`,
    rawPath: req.path,
    rawQueryString: req.url.includes('?')
      ? req.url.split('?')[1] ?? ''
      : '',
    headers: Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.join(',') : (v ?? ''),
      ]),
    ),
    queryStringParameters: req.query as Record<string, string>,
    requestContext: {
      accountId: 'local',
      apiId: 'local',
      domainName: 'localhost',
      domainPrefix: 'local',
      http: {
        method: req.method,
        path: req.path,
        protocol: 'HTTP/1.1',
        sourceIp: req.ip,
        userAgent: req.get('user-agent') ?? '',
      },
      requestId: `local-${Date.now()}`,
      routeKey: `${req.method} ${req.path}`,
      stage: process.env.ENV ?? 'dev',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    body: req.body ? JSON.stringify(req.body) : undefined,
    isBase64Encoded: false,
  };
}

async function invokeHandler(
  req: express.Request,
  res: express.Response,
  handler: (event: APIGatewayProxyEventV2) => Promise<unknown>,
) {
  try {
    const result = await handler(toApiGatewayEvent(req));
    if (result && typeof result === 'object' && 'statusCode' in result) {
      const apiResult = result as {
        statusCode: number;
        headers?: Record<string, string>;
        body?: string;
      };
      if (apiResult.headers) {
        for (const [key, value] of Object.entries(apiResult.headers)) {
          res.setHeader(key, value);
        }
      }
      res.status(apiResult.statusCode).send(apiResult.body ?? '');
      return;
    }
    res.status(500).json({ error: 'Invalid handler response' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

app.get('/health', (req, res) => invokeHandler(req, res, healthHandler));

app.listen(PORT, () => {
  console.log(
    `[LitCircle local API] http://localhost:${PORT} (ENV=${process.env.ENV ?? 'dev'})`,
  );
  console.log('Using AWS credential chain from CLI profile.');
});
