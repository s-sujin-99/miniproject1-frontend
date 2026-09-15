export interface ApiFieldError {
  field: string;
  reason: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: ApiFieldError[],
    public traceId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, init);

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      body?.code ?? 'UNKNOWN',
      body?.message ?? res.statusText,
      body?.fieldErrors,
      body?.traceId,
    );
  }

  return res.json();
}
