import { randomUUID } from 'node:crypto';
import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, tableName } from '../../common/dynamo';

const SESSIONS_TABLE = process.env.SESSIONS_TABLE ?? tableName('sessions');
const TTL_SECONDS = 7 * 24 * 60 * 60;

export interface RoleplayParticipantRecord {
  name: string;
  roleId: string;
}

export interface RoleplaySessionRecord {
  code: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  bookTitle: string | null;
  bookKey: string | null;
  coverUrl: string | null;
  participants: RoleplayParticipantRecord[];
  finalizedNames: string[];
}

interface RoleplaySessionDbItem {
  pk: string;
  sk: 'METADATA';
  gsi1pk: string;
  gsi1sk: string;
  entityType: 'ROLEPLAY_SESSION';
  sessionId: string;
  accessCode: string;
  bookTitle: string | null;
  bookKey: string | null;
  coverUrl: string | null;
  participants: RoleplayParticipantRecord[];
  finalizedNames: string[];
  createdAt: string;
  updatedAt: string;
  status: 'review';
  ttl: number;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function sessionPk(sessionId: string): string {
  return `SESSION#${sessionId}`;
}

function codeGsiPk(code: string): string {
  return `CODE#${normalizeCode(code)}`;
}

function toRecord(item: RoleplaySessionDbItem): RoleplaySessionRecord {
  return {
    code: item.accessCode,
    sessionId: item.sessionId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    bookTitle: item.bookTitle,
    bookKey: item.bookKey ?? null,
    coverUrl: item.coverUrl ?? null,
    participants: item.participants.map((p) => ({ ...p })),
    finalizedNames: [...item.finalizedNames],
  };
}

export class RoleplaySessionRepository {
  async findByAccessCode(code: string): Promise<RoleplaySessionRecord | null> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: SESSIONS_TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression: 'gsi1pk = :code',
        ExpressionAttributeValues: {
          ':code': codeGsiPk(code),
        },
        Limit: 1,
      }),
    );

    const item = result.Items?.[0] as RoleplaySessionDbItem | undefined;
    return item ? toRecord(item) : null;
  }

  async upsert(input: {
    code: string;
    bookTitle: string | null;
    bookKey: string | null;
    coverUrl: string | null;
    participants: RoleplayParticipantRecord[];
  }): Promise<RoleplaySessionRecord> {
    const accessCode = normalizeCode(input.code);
    const existingResult = await docClient.send(
      new QueryCommand({
        TableName: SESSIONS_TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression: 'gsi1pk = :code',
        ExpressionAttributeValues: {
          ':code': codeGsiPk(accessCode),
        },
        Limit: 1,
      }),
    );
    const existing = existingResult.Items?.[0] as RoleplaySessionDbItem | undefined;

    const now = new Date().toISOString();
    const sessionId = existing?.sessionId ?? randomUUID();
    const createdAt = existing?.createdAt ?? now;

    const item: RoleplaySessionDbItem = {
      pk: sessionPk(sessionId),
      sk: 'METADATA',
      gsi1pk: codeGsiPk(accessCode),
      gsi1sk: sessionPk(sessionId),
      entityType: 'ROLEPLAY_SESSION',
      sessionId,
      accessCode,
      bookTitle: input.bookTitle,
      bookKey: input.bookKey,
      coverUrl: input.coverUrl,
      participants: input.participants.map((p) => ({ ...p })),
      finalizedNames: existing?.finalizedNames ?? [],
      createdAt,
      updatedAt: now,
      status: 'review',
      ttl: Math.floor(Date.now() / 1000) + TTL_SECONDS,
    };

    await docClient.send(
      new PutCommand({
        TableName: SESSIONS_TABLE,
        Item: item,
      }),
    );

    return toRecord(item);
  }

  async markParticipantFinalized(
    code: string,
    participantName: string,
  ): Promise<RoleplaySessionRecord | null> {
    const existingResult = await docClient.send(
      new QueryCommand({
        TableName: SESSIONS_TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression: 'gsi1pk = :code',
        ExpressionAttributeValues: {
          ':code': codeGsiPk(code),
        },
        Limit: 1,
      }),
    );
    const existing = existingResult.Items?.[0] as RoleplaySessionDbItem | undefined;
    if (!existing) return null;

    const finalizedNames = existing.finalizedNames.includes(participantName)
      ? existing.finalizedNames
      : [...existing.finalizedNames, participantName];
    const updatedAt = new Date().toISOString();

    await docClient.send(
      new UpdateCommand({
        TableName: SESSIONS_TABLE,
        Key: { pk: existing.pk, sk: existing.sk },
        UpdateExpression: 'SET finalizedNames = :names, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':names': finalizedNames,
          ':updatedAt': updatedAt,
        },
      }),
    );

    return toRecord({ ...existing, finalizedNames, updatedAt });
  }
}
