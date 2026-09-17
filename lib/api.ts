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

const TOKEN_KEY = 'accessToken';
// proxy.ts(서버)는 localStorage를 볼 수 없으므로, 보호 라우트 판단용으로 로그인 여부만 알리는
// 비민감 쿠키를 별도로 둔다. 실제 인증 토큰은 이 쿠키가 아니라 localStorage에만 있다(shrimp-rules §5.4).
const SESSION_COOKIE = 'session';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function storeSession(token: string, expiresInSeconds: number) {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${expiresInSeconds}; samesite=lax`;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

interface ApiFetchInit extends RequestInit {
  /** true면 저장된 accessToken을 Authorization 헤더로 붙이고, 401 응답 시 세션을 지우고 로그인으로 보낸다. */
  auth?: boolean;
}

export async function apiFetch<T>(path: string, init?: ApiFetchInit): Promise<T> {
  const { auth, headers, ...rest } = init ?? {};
  const finalHeaders = new Headers(headers);
  if (auth) {
    const token = getStoredToken();
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    // 재시도 로직 없음 — refresh token이 없으므로(shrimp-rules §5.2) 만료/무효 토큰은 그냥 로그아웃 처리한다.
    if (res.status === 401 && auth && typeof window !== 'undefined') {
      clearSession();
      const redirect = window.location.pathname + window.location.search;
      // apiFetch는 컴포넌트가 아니라 useRouter를 쓸 수 없다. 401은 세션이 죽은 상태라 React Query
      // 캐시 등 클라이언트 상태를 통째로 리셋하는 편이 안전해 router.push 대신 하드 이동을 쓴다.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
    }
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
