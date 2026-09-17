// API.md 인증 API 응답. 손으로 정의 — openapi-typescript 파이프라인이 아직 없다(types/drug.ts와 동일한 사정).
export type UserRole = 'USER' | 'ADMIN';

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: number;
    nickname: string;
    role: UserRole;
  };
}

export interface SignupResponse {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
  createdAt: string;
}

export interface MeResponse {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
  reportCount: number;
  createdAt: string;
}
