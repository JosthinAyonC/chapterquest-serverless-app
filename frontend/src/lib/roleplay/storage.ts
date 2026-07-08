import type { RoleplayMode } from './templates';

export type PlayerStep =
  | 'name'
  | 'role'
  | 'mode'
  | 'online'
  | 'confirm-done'
  | 'already-responded';

export interface RoleplayTextField {
  id: string;
  label: string;
  value: string;
  top: string;
  left: string;
  width: string;
  height: string;
}

export interface RoleplayPlayerProgress {
  participantName: string;
  mode: RoleplayMode | null;
  textFields: RoleplayTextField[];
  drawingDataUrl: string | null;
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

export const DEFAULT_TEXT_FIELDS: Omit<RoleplayTextField, 'value'>[] = [
  { id: 'response-1', label: 'Response 1', top: '18%', left: '8%', width: '84%', height: '12%' },
  { id: 'response-2', label: 'Response 2', top: '34%', left: '8%', width: '84%', height: '12%' },
  { id: 'response-3', label: 'Response 3', top: '50%', left: '8%', width: '84%', height: '12%' },
  { id: 'response-4', label: 'Response 4', top: '66%', left: '8%', width: '84%', height: '12%' },
];

export function getAlreadyRespondedCodes(): string[] {
  const raw = localStorage.getItem(ALREADY_RESPONDED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map((code) => normalizeCode(String(code))) : [];
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
    participantName,
    mode: null,
    textFields: DEFAULT_TEXT_FIELDS.map((field) => ({ ...field, value: '' })),
    drawingDataUrl: null,
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
    return JSON.parse(raw) as RoleplayPlayerProgress;
  } catch {
    return createEmptyProgress(participantName);
  }
}

export function savePlayerProgress(
  code: string,
  progress: RoleplayPlayerProgress,
): void {
  const next: RoleplayPlayerProgress = {
    ...progress,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(
    progressKey(normalizeCode(code), progress.participantName),
    JSON.stringify(next),
  );
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
