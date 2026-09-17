'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const TABS = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/reports', label: '이상치 제보 관리' },
  { href: '/admin/stats', label: '가격 통계' },
];

// ROADMAP T-33 — ADMIN이 아니면 홈으로 리다이렉트한다. proxy.ts는 로그인 여부(session 쿠키)만
// 보고 role은 모르므로(ROADMAP T-25), role 가드는 여기 클라이언트에서 한 번만 하고 두 admin 페이지가
// 공유한다. 확정되기 전엔 children을 렌더하지 않아 관리자 화면이 잠깐이라도 노출되지 않게 한다.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  if (isLoading || user?.role !== 'ADMIN') return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav className="border-border mb-6 flex gap-1 border-b text-sm">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-3 py-2',
              pathname === tab.href
                ? 'border-primary text-foreground border-b-2 font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
