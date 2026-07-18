import type { RoleplayMode } from './templates';

export type PlayerStep =
  | 'name'
  | 'role'
  | 'mode'
  | 'online'
  | 'confirm-done'
  | 'already-responded';

export const CANVAS_SCHEMA_VERSION = 2;
export const PDF_PAGE_COUNT = 2;

export interface RoleplayPlayerProgress {
  schemaVersion: typeof CANVAS_SCHEMA_VERSION;
  participantName: string;
  mode: RoleplayMode | null;
  canvasPages: (string | null)[];
  finalized: boolean;
  updatedAt: string;
}

export interface RoleplayPlayerUiState {
  participantName: string;
  identityConfirmed: boolean;
  step: PlayerStep;
}

const PROGRESS_PREFIX = 'litcircle:player:';
const UI_PREFIX = 'litcircle:player-ui:';
const ALREADY_RESPONDED_KEY = 'litcircle:already-responded';

function progressKey(code: string, participantName: string): string {
  return `${PROGRESS_PREFIX}${code}:${participantName}`;
}

function uiStateKey(code: string): string {
  return `${UI_PREFIX}${code}`;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function emptyCanvasPages(): (string | null)[] {
  return Array.from({ length: PDF_PAGE_COUNT }, () => null);
}

function isCurrentSchema(raw: unknown): raw is RoleplayPlayerProgress {
  if (!raw || typeof raw !== 'object') return false;
  const record = raw as Record<string, unknown>;
  return (
    record.schemaVersion === CANVAS_SCHEMA_VERSION &&
    Array.isArray(record.canvasPages)
  );
}

export function getAlreadyRespondedCodes(): string[] {
  const raw = localStorage.getItem(ALREADY_RESPONDED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.map((code) => normalizeCode(String(code)))
      : [];
  } catch {
    return [];
  }
}

export function hasAlreadyResponded(code: string): boolean {
  return getAlreadyRespondedCodes().includes(normalizeCode(code));
}

export function markAlreadyResponded(code: string): void {
  const normalized = normalizeCode(code);
  const codes = getAlreadyRespondedCodes();
  if (codes.includes(normalized)) return;
  localStorage.setItem(ALREADY_RESPONDED_KEY, JSON.stringify([...codes, normalized]));
}

export function clearPlayerSessionLocalData(code: string, participantName: string): void {
  localStorage.removeItem(progressKey(normalizeCode(code), participantName));
  localStorage.removeItem(uiStateKey(normalizeCode(code)));
}

export function createEmptyProgress(participantName: string): RoleplayPlayerProgress {
  return {
    schemaVersion: CANVAS_SCHEMA_VERSION,
    participantName,
    mode: null,
    canvasPages: emptyCanvasPages(),
    finalized: false,
    updatedAt: new Date().toISOString(),
  };
}

export function loadPlayerProgress(
  code: string,
  participantName: string,
): RoleplayPlayerProgress {
  const raw = localStorage.getItem(progressKey(normalizeCode(code), participantName));
  if (!raw) return createEmptyProgress(participantName);
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isCurrentSchema(parsed)) return createEmptyProgress(participantName);
    return {
      ...parsed,
      canvasPages: emptyCanvasPages().map(
        (_, index) => parsed.canvasPages[index] ?? null,
      ),
    };
  } catch {
    return createEmptyProgress(participantName);
  }
}

export class PlayerProgressStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlayerProgressStorageError';
  }
}

export function savePlayerProgress(
  code: string,
  progress: RoleplayPlayerProgress,
): void {
  const next: RoleplayPlayerProgress = {
    ...progress,
    schemaVersion: CANVAS_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(
      progressKey(normalizeCode(code), progress.participantName),
      JSON.stringify(next),
    );
  } catch {
    throw new PlayerProgressStorageError(
      'Could not save your work. Try removing large images or clearing browser storage.',
    );
  }
}

export function loadPlayerUiState(code: string): RoleplayPlayerUiState | null {
  const raw = localStorage.getItem(uiStateKey(normalizeCode(code)));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoleplayPlayerUiState;
  } catch {
    return null;
  }
}

export function savePlayerUiState(code: string, state: RoleplayPlayerUiState): void {
  localStorage.setItem(uiStateKey(normalizeCode(code)), JSON.stringify(state));
}

export function resolveStepFromProgress(
  progress: RoleplayPlayerProgress,
): PlayerStep {
  if (progress.finalized) return 'already-responded';
  if (progress.mode === 'online') return 'online';
  if (progress.mode === 'download') return 'confirm-done';
  return 'mode';
}

export function completePlayerSessionLocally(code: string, participantName: string): void {
  clearPlayerSessionLocalData(code, participantName);
  markAlreadyResponded(code);
}
