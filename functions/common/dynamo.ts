import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION ?? 'us-east-1';

const client = new DynamoDBClient({ region });

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export function tableName(suffix: string): string {
  const env = process.env.ENV ?? 'dev';
  return `${env}-chapterquest-${suffix}`;
}
