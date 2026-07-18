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

export interface VideoUploadUrlResponse {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

export interface SessionVideoResponse {
  participantName: string;
  roleId: string;
  url: string;
  contentType: string;
  uploadedAt: string;
}

export interface SessionVideosResponse {
  videos: SessionVideoResponse[];
}

export const REVIEW_VIDEO_MAX_BYTES = 200 * 1024 * 1024;

export const REVIEW_VIDEO_ACCEPTED_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const;

export type ReviewVideoContentType = (typeof REVIEW_VIDEO_ACCEPTED_TYPES)[number];

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
  videoKey: string,
  videoContentType: string,
): Promise<RoleplaySessionResponse> {
  const encoded = encodeURIComponent(code.trim().toUpperCase());
  const data = await apiFetch<{ session: RoleplaySessionResponse }>(
    `/sessions/by-code/${encoded}/finalize`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantName, videoKey, videoContentType }),
    },
  );
  return data.session;
}

export async function requestVideoUploadUrlApi(input: {
  code: string;
  participantName: string;
  contentType: string;
  sizeBytes: number;
}): Promise<VideoUploadUrlResponse> {
  const encoded = encodeURIComponent(input.code.trim().toUpperCase());
  return apiFetch<VideoUploadUrlResponse>(
    `/sessions/by-code/${encoded}/videos/upload-url`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantName: input.participantName,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
      }),
    },
  );
}

export async function fetchSessionVideosApi(
  code: string,
): Promise<SessionVideoResponse[]> {
  const encoded = encodeURIComponent(code.trim().toUpperCase());
  const data = await apiFetch<SessionVideosResponse>(
    `/sessions/by-code/${encoded}/videos`,
  );
  return data.videos;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percent: number;
}

export function uploadReviewVideoToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (event: UploadProgressEvent) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      const total = event.lengthComputable ? event.total : file.size;
      const loaded = event.loaded;
      const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
      onProgress({ loaded, total, percent });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(
        new ApiError(
          'Video upload failed. Try again.',
          xhr.status,
          'upload_failed',
        ),
      );
    };

    xhr.onerror = () => {
      reject(
        new ApiError(
          'Video upload failed. Check your connection.',
          0,
          'upload_failed',
        ),
      );
    };

    xhr.send(file);
  });
}
