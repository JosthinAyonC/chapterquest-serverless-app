import {
  RoleplaySessionRepository,
  type RoleplayParticipantRecord,
  type RoleplaySessionRecord,
} from '../repositories/roleplay-session.repository';

export class RoleplaySessionService {
  constructor(private readonly repository = new RoleplaySessionRepository()) {}

  publish(input: {
    code: string;
    bookTitle: string | null;
    participants: RoleplayParticipantRecord[];
  }): Promise<RoleplaySessionRecord> {
    if (!input.code.trim()) {
      throw new RoleplaySessionError('invalid_request', 'code is required.');
    }
    if (!input.participants.length) {
      throw new RoleplaySessionError('invalid_request', 'participants are required.');
    }
    return this.repository.upsert(input);
  }

  getByAccessCode(code: string): Promise<RoleplaySessionRecord | null> {
    if (!code.trim()) {
      throw new RoleplaySessionError('invalid_request', 'accessCode is required.');
    }
    return this.repository.findByAccessCode(code);
  }

  finalizeParticipant(
    code: string,
    participantName: string,
  ): Promise<RoleplaySessionRecord | null> {
    if (!code.trim() || !participantName.trim()) {
      throw new RoleplaySessionError(
        'invalid_request',
        'accessCode and participantName are required.',
      );
    }
    return this.repository.markParticipantFinalized(code, participantName.trim());
  }
}

export class RoleplaySessionError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'RoleplaySessionError';
    this.code = code;
  }
}

export type { RoleplaySessionRecord };
