const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function requireApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new ApiError(
      'VITE_API_BASE_URL is not configured in the frontend build.',
      0,
      'config_error',
    );
  }
  return API_BASE_URL.replace(/\/$/, '');
}

export interface RegisterGuestResponse {
  username: string;
  type: 'guest';
  createdAt: string;
}

export interface ApiErrorBody {
  error: string;
  message: string;
}

export interface LibraryBookResponse {
  key: string;
  title: string;
  author: string;
  language: string;
  description: string;
  audience?: string;
  coverUrl: string | null;
}

export interface LibraryCatalogResponse {
  books: LibraryBookResponse[];
}

export interface BookPreviewResponse {
  url: string;
  expiresIn: number | null;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** @deprecated Use ApiError */
export class GuestApiError extends ApiError {
  constructor(message: string, status: number, code: string) {
    super(message, status, code);
    this.name = 'GuestApiError';
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = requireApiBaseUrl();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, init);
  } catch {
    throw new ApiError(
      'Could not reach the API. Check backend URL or CORS.',
      0,
      'network_error',
    );
  }

  const body = (await response.json()) as T | ApiErrorBody;

  if (!response.ok) {
    const err = body as ApiErrorBody;
    throw new ApiError(
      err.message ?? 'API request failed',
      response.status,
      err.error ?? 'unknown',
    );
  }

  return body as T;
}

export async function registerGuest(
  username: string,
): Promise<RegisterGuestResponse> {
  return apiFetch<RegisterGuestResponse>('/users/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
}

export async function getLibrary(): Promise<LibraryBookResponse[]> {
  const data = await apiFetch<LibraryCatalogResponse>('/library');
  return data.books;
}

export async function getBookPreviewUrl(key: string): Promise<string> {
  const encoded = encodeURIComponent(key);
  const data = await apiFetch<BookPreviewResponse>(
    `/library/${encoded}/preview-url`,
  );
  return data.url;
}

export interface RoleplaySessionResponse {
  code: string;
  createdAt: string;
  bookTitle: string | null;
  bookKey?: string | null;
  coverUrl?: string | null;
  participants: Array<{ name: string; roleId: string }>;
  finalizedNames: string[];
}

export async function publishRoleplaySessionApi(input: {
  code: string;
  bookTitle: string | null;
  bookKey?: string | null;
  coverUrl?: string | null;
  participants: Array<{ name: string; roleId: string }>;
}): Promise<RoleplaySessionResponse> {
  const data = await apiFetch<{ session: RoleplaySessionResponse }>('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return data.session;
}

export async function fetchRoleplaySessionByCode(
  code: string,
): Promise<RoleplaySessionResponse> {
  const encoded = encodeURIComponent(code.trim().toUpperCase());
  const data = await apiFetch<{ session: RoleplaySessionResponse }>(
    `/sessions/by-code/${encoded}`,
  );
  return data.session;
}

export async function finalizeRoleplayParticipantApi(
  code: string,
  participantName: string,
): Promise<RoleplaySessionResponse> {
  const encoded = encodeURIComponent(code.trim().toUpperCase());
  const data = await apiFetch<{ session: RoleplaySessionResponse }>(
    `/sessions/by-code/${encoded}/finalize`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantName }),
    },
  );
  return data.session;
}
