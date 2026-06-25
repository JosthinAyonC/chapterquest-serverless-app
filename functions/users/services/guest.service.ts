import type { UserProfile } from '../../common/models';
import { UserRepository } from '../repositories/user.repository';

export class GuestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuestValidationError';
  }
}

export type RegisterGuestResult =
  | { status: 'created'; profile: UserProfile }
  | { status: 'conflict' };

export class GuestService {
  constructor(private readonly users = new UserRepository()) {}

  normalizeUsername(username: string): string {
    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 2 || trimmed.length > 32) {
      throw new GuestValidationError(
        'El nombre debe tener entre 2 y 32 caracteres.',
      );
    }
    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      throw new GuestValidationError(
        'Solo letras minúsculas, números y guión bajo.',
      );
    }
    return trimmed;
  }

  async registerGuest(username: string): Promise<RegisterGuestResult> {
    const normalized = this.normalizeUsername(username);
    const existing = await this.users.findByUsername(normalized);
    if (existing) {
      return { status: 'conflict' };
    }

    const profile = await this.users.createGuest(normalized);
    return { status: 'created', profile };
  }
}
