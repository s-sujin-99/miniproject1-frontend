'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, storeSession, clearSession, getStoredToken } from '@/lib/api';
import type { LoginResponse, MeResponse, UserRole } from '@/types/auth';

export interface AuthUser {
  id: number;
  nickname: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Google OAuth 콜백(app/oauth/callback)에서 fragment로 받은 토큰을 세션에 반영할 때 쓴다. */
  loginWithToken: (token: string, expiresInSeconds: number) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 서버와 클라이언트 첫 렌더를 일치시키기 위해 초기값은 항상 로그아웃 상태로 두고,
  // 마운트 이후 effect에서만 localStorage를 읽는다(hooks/use-user-location.tsx와 동일한 이유).
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage(외부 상태) 확인 결과를 마운트 직후 1회 반영
      setIsLoading(false);
      return;
    }
    apiFetch<MeResponse>('/api/v1/auth/me', { auth: true })
      .then((me) => setUser({ id: me.id, nickname: me.nickname, role: me.role }))
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    storeSession(res.accessToken, res.expiresIn);
    setUser(res.user);
  }, []);

  const loginWithToken = useCallback(async (token: string, expiresInSeconds: number) => {
    storeSession(token, expiresInSeconds);
    const me = await apiFetch<MeResponse>('/api/v1/auth/me', { auth: true });
    setUser({ id: me.id, nickname: me.nickname, role: me.role });
  }, []);

  const logout = useCallback(async () => {
    clearSession();
    setUser(null);
    // 로그아웃 API는 상태가 없어(§5.2) 실패해도 클라이언트 세션 정리에는 영향 없다.
    await apiFetch('/api/v1/auth/logout', { method: 'POST', auth: true }).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}
