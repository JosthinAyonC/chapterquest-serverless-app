import type { Book } from '../../mocks/books';
import type { RoleId } from '../../mocks/roles';
import {
  ApiError,
  fetchRoleplaySessionByCode,
  finalizeRoleplayParticipantApi,
  publishRoleplaySessionApi,
  type RoleplaySessionResponse,
} from '../api';

export interface PublishedParticipant {
  name: string;
  roleId: RoleId;
}

export interface PublishedRoleplaySession {
  code: string;
  createdAt: string;
  bookTitle: string | null;
  participants: PublishedParticipant[];
  finalizedNames: string[];
}

const PUBLISHED_PREFIX = 'litcircle:published:';

function toPublishedSession(session: RoleplaySessionResponse): PublishedRoleplaySession {
  return {
    code: session.code,
    createdAt: session.createdAt,
    bookTitle: session.bookTitle,
    participants: session.participants.map((p) => ({
      name: p.name,
      roleId: p.roleId as RoleId,
    })),
    finalizedNames: [...session.finalizedNames],
  };
}

function cachePublishedSession(session: PublishedRoleplaySession): void {
  localStorage.setItem(`${PUBLISHED_PREFIX}${session.code}`, JSON.stringify(session));
}

export function generateSessionCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function buildRoleplayPlayerUrl(code: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/roleplay/${code}`;
}

export async function publishRoleplaySession(input: {
  code: string;
  book: Book | null;
  participants: PublishedParticipant[];
}): Promise<PublishedRoleplaySession> {
  const session = toPublishedSession(
    await publishRoleplaySessionApi({
      code: input.code,
      bookTitle: input.book?.title ?? null,
      participants: input.participants.map((p) => ({
        name: p.name,
        roleId: p.roleId,
      })),
    }),
  );
  cachePublishedSession(session);
  localStorage.setItem('litcircle:active-roleplay-code', session.code);
  return session;
}

export function loadPublishedSessionLocal(code: string): PublishedRoleplaySession | null {
  const raw = localStorage.getItem(`${PUBLISHED_PREFIX}${code}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublishedRoleplaySession;
  } catch {
    return null;
  }
}

export async function loadPublishedSession(
  code: string,
): Promise<PublishedRoleplaySession | null> {
  const normalized = code.trim().toUpperCase();
  try {
    const session = toPublishedSession(await fetchRoleplaySessionByCode(normalized));
    cachePublishedSession(session);
    return session;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    return loadPublishedSessionLocal(normalized);
  }
}

export async function markParticipantFinalized(
  code: string,
  participantName: string,
): Promise<PublishedRoleplaySession | null> {
  try {
    const session = toPublishedSession(
      await finalizeRoleplayParticipantApi(code, participantName),
    );
    cachePublishedSession(session);
    return session;
  } catch {
    const session = loadPublishedSessionLocal(code);
    if (!session) return null;
    if (!session.finalizedNames.includes(participantName)) {
      session.finalizedNames.push(participantName);
    }
    cachePublishedSession(session);
    return session;
  }
}

export function isParticipantFinalized(
  session: PublishedRoleplaySession,
  participantName: string,
): boolean {
  return session.finalizedNames.includes(participantName);
}

export function getActiveRoleplayCode(): string | null {
  return localStorage.getItem('litcircle:active-roleplay-code');
}
