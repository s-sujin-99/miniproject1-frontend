'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// 백엔드 OAuth2SuccessHandler가 쿼리스트링이 아니라 fragment(#token=)로 JWT를 보낸다(shrimp-rules §5.3,
// 로그/Referer에 남기지 않기 위함). fragment는 서버에서 절대 볼 수 없으므로 여기서만 읽을 수 있다.
function secondsUntilExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Math.max(60, Math.floor(payload.exp - Date.now() / 1000));
  } catch {
    return 24 * 60 * 60; // 파싱 실패 시 백엔드 기본 만료(jwt.expiration-ms=86400000)로 대체
  }
}

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const [failed, setFailed] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const match = window.location.hash.match(/token=([^&]+)/);
    if (!match) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- location.hash(외부 상태) 확인 결과를 마운트 직후 1회 반영
      setFailed(true);
      return;
    }
    const token = decodeURIComponent(match[1]);
    loginWithToken(token, secondsUntilExpiry(token))
      .then(() => router.replace('/'))
      .catch(() => setFailed(true));
  }, [loginWithToken, router]);

  return (
    <p className="mx-auto max-w-sm px-4 py-16 text-center text-sm">
      {failed ? (
        <span className="text-destructive">로그인에 실패했습니다. 다시 시도해주세요.</span>
      ) : (
        <span className="text-muted-foreground">로그인 처리 중...</span>
      )}
    </p>
  );
}
