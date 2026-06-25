import { describe, expect, it, vi } from 'vitest';
import { GuestService, GuestValidationError } from './guest.service';
import type { UserProfile } from '../../common/models';

describe('GuestService', () => {
  it('rejects invalid usernames', () => {
    const service = new GuestService();
    expect(() => service.normalizeUsername('a')).toThrow(GuestValidationError);
    expect(() => service.normalizeUsername('Bad Name')).toThrow(
      GuestValidationError,
    );
  });

  it('returns conflict when username exists', async () => {
    const existing: UserProfile = {
      pk: 'USER#lector',
      sk: 'PROFILE',
      username: 'lector',
      type: 'guest',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastSeenAt: '2026-01-01T00:00:00.000Z',
    };

    const users = {
      findByUsername: vi.fn().mockResolvedValue(existing),
      createGuest: vi.fn(),
    };

    const service = new GuestService(users as never);
    const result = await service.registerGuest('lector');

    expect(result).toEqual({ status: 'conflict' });
    expect(users.createGuest).not.toHaveBeenCalled();
  });

  it('creates guest when username is available', async () => {
    const profile: UserProfile = {
      pk: 'USER#nuevo',
      sk: 'PROFILE',
      username: 'nuevo',
      type: 'guest',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastSeenAt: '2026-01-01T00:00:00.000Z',
    };

    const users = {
      findByUsername: vi.fn().mockResolvedValue(null),
      createGuest: vi.fn().mockResolvedValue(profile),
    };

    const service = new GuestService(users as never);
    const result = await service.registerGuest('Nuevo');

    expect(result).toEqual({ status: 'created', profile });
    expect(users.createGuest).toHaveBeenCalledWith('nuevo');
  });
});
