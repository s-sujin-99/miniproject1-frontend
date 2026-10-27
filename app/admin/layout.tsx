'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { BarChart3, Flag, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const TABS = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/reports', label: '이상치 제보 관리', icon: Flag },
  { href: '/admin/stats', label: '가격 통계', icon: BarChart3 },
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
    <div className="mx-auto max-w-7xl px-6 py-6">
      <nav className="bg-muted mb-6 flex w-fit gap-1 rounded-full p-1 text-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 font-medium transition-colors',
                active
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {/* 대시보드 콘텐츠 높이(실측 1123px)를 상한선으로 쓴다. 콘텐츠가 이보다 짧으면(가격 통계
          지역별 통계 등) 그만큼만 차지하고, 길면(이상치 제보 관리 등) 여기서 전체가 스크롤된다.
          제목/탭까지 같이 스크롤되지 않게 하려면 각 페이지 자신의 본문 영역에 별도
          max-height(총 상한 - 그 페이지 제목/탭 높이)를 준다 — 페이지별 구현을 참고. */}
      <div className="max-h-[1123px] overflow-y-auto">{children}</div>
    </div>
  );
}
