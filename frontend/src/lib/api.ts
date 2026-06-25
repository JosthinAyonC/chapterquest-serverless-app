const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function requireApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new GuestApiError(
      'VITE_API_BASE_URL no está configurada en el build del frontend.',
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
  const baseUrl = requireApiBaseUrl();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/users/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
  } catch {
    throw new GuestApiError(
      'No se pudo conectar con la API. Revisa la URL del backend o CORS.',
      0,
      'network_error',
    );
  }

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
