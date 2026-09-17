'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

// 헤더에 로그인 상태를 보여준다(ROADMAP T-25). 로딩 중에는 깜빡임을 피하려 아무것도 렌더하지 않는다.
export function UserMenu() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return (
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">로그인</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {user.role === 'ADMIN' && (
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          관리자
        </Link>
      )}
      <Link href="/me" className="text-muted-foreground hover:text-foreground">
        {user.nickname}님
      </Link>
      <Button variant="ghost" size="sm" onClick={() => logout()}>
        로그아웃
      </Button>
    </div>
  );
}
