import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, tableName } from '../../common/dynamo';
import type { UserProfile } from '../../common/models';

const USERS_TABLE = process.env.USERS_TABLE ?? tableName('users');

function userPk(username: string): string {
  return `USER#${username.toLowerCase()}`;
}

export class UserRepository {
  async findByUsername(username: string): Promise<UserProfile | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { pk: userPk(username), sk: 'PROFILE' },
      }),
    );
    return (result.Item as UserProfile | undefined) ?? null;
  }

  async createGuest(username: string): Promise<UserProfile> {
    const normalized = username.toLowerCase();
    const now = new Date().toISOString();
    const profile: UserProfile = {
      pk: userPk(normalized),
      sk: 'PROFILE',
      username: normalized,
      type: 'guest',
      createdAt: now,
      lastSeenAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: profile,
        ConditionExpression: 'attribute_not_exists(pk)',
      }),
    );

    return profile;
  }
}
