import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';
import express from 'express';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler as healthHandler } from '../auth/handlers/health';
import { handler as guestHandler } from '../users/handlers/guest';
import { docClient, tableName } from '../common/dynamo';

const envFile = resolve(import.meta.dirname, '../.env');
if (existsSync(envFile)) {
  loadEnvFile(envFile);
}

const app = express();
const PORT = Number(process.env.LOCAL_API_PORT ?? 3001);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
} as const;

app.use((req, res, next) => {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

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
        sourceIp: req.ip ?? '',
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
app.post('/users/guest', (req, res) => invokeHandler(req, res, guestHandler));

async function verifyAwsAccess(): Promise<void> {
  const profile = process.env.AWS_PROFILE ?? '(default credential chain)';
  const region = process.env.AWS_REGION ?? 'us-east-1';
  const usersTable = tableName('users');

  try {
    await docClient.send(
      new GetCommand({
        TableName: usersTable,
        Key: { pk: 'USER#__startup_probe__', sk: 'PROFILE' },
      }),
    );
    console.log(`AWS OK — ${usersTable} (${profile}, ${region})`);
  } catch (error) {
    const name = error instanceof Error ? error.name : 'UnknownError';
    const message = error instanceof Error ? error.message : String(error);

    if (name === 'CredentialsProviderError') {
      console.error('[LitCircle local API] Sin credenciales AWS.');
      console.error('  Copia functions/.env.example → functions/.env');
      console.error('  Ajusta AWS_PROFILE (ej. litcircle) y reinicia pnpm dev:api');
      console.error(`  Detalle: ${message}`);
      return;
    }

    if (name === 'ResourceNotFoundException') {
      console.error(`[LitCircle local API] Tabla ${usersTable} no existe en ${region}.`);
      console.error('  Despliega el stack dev o revisa ENV en functions/.env');
      return;
    }

    console.error('[LitCircle local API] Error al verificar DynamoDB:', message);
  }
}

app.listen(PORT, () => {
  console.log(
    `[LitCircle local API] http://localhost:${PORT} (ENV=${process.env.ENV ?? 'dev'})`,
  );
  void verifyAwsAccess();
});
