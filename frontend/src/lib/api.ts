const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export interface RegisterGuestResponse {
  username: string;
  type: 'guest';
  createdAt: string;
}

export interface ApiErrorBody {
  error: string;
  message: string;
}

export class GuestApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'GuestApiError';
    this.status = status;
    this.code = code;
  }
}

export async function registerGuest(
  username: string,
): Promise<RegisterGuestResponse> {
  const response = await fetch(`${API_BASE_URL}/users/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });

  const body = (await response.json()) as
    | RegisterGuestResponse
    | ApiErrorBody;

  if (!response.ok) {
    const err = body as ApiErrorBody;
    throw new GuestApiError(
      err.message ?? 'Error al registrar invitado',
      response.status,
      err.error ?? 'unknown',
    );
  }

  return body as RegisterGuestResponse;
}
