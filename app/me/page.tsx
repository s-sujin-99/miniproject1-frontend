'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorPanel } from '@/components/error-panel';
import { apiFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import type { PageResponse } from '@/types/api';
import type { MeResponse } from '@/types/auth';
import type { PriceReportListItem } from '@/types/report';

function StatusBadge({
  status,
  flagged,
}: {
  status: PriceReportListItem['status'];
  flagged: boolean;
}) {
  if (status === 'HIDDEN') {
    return (
      <span className="border-border text-muted-foreground border px-2 py-0.5 text-xs font-medium">
        숨김처리됨
      </span>
    );
  }
  if (flagged) {
    return (
      <span className="bg-accent text-accent-foreground px-2 py-0.5 text-xs font-medium">
        검토중
      </span>
    );
  }
  return (
    <span className="bg-secondary/10 text-secondary px-2 py-0.5 text-xs font-medium">반영됨</span>
  );
}

// ROADMAP T-30 — proxy.ts가 /me/:path* 를 로그인으로 가드한다. accessToken은 localStorage에만 있어
// (shrimp-rules §5.4) 서버 컴포넌트에서는 인증 요청을 만들 수 없다 — price-report-form.tsx와 같은 이유로
// 클라이언트 컴포넌트에서 react-query로 직접 불러온다.
export default function MyReportsPage() {
  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiFetch<MeResponse>('/api/v1/auth/me', { auth: true }),
  });
  const reportsQuery = useQuery({
    queryKey: ['price-reports', 'mine'],
    queryFn: () =>
      apiFetch<PageResponse<PriceReportListItem>>('/api/v1/price-reports?mine=true&size=50', {
        auth: true,
      }),
  });

  if (reportsQuery.isError) {
    return (
      <div className="bg-background flex-1">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <ErrorPanel
            title="제보 목록을 불러오지 못했습니다"
            description="잠시 후 다시 시도해주세요."
          />
        </div>
      </div>
    );
  }

  const reports = reportsQuery.data?.content ?? [];

  return (
    <div className="bg-background flex-1">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.2em]">MY REPORTS</p>
        <h1 className="text-foreground mt-1 text-3xl font-black tracking-tight">내 제보 목록</h1>
        <p className="text-muted-foreground mt-1 mb-6 text-sm">
          {meQuery.data ? `지금까지 총 ${meQuery.data.reportCount}건의 가격을 제보했어요.` : ' '}
        </p>

        {reportsQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">불러오는 중...</p>
        ) : reports.length === 0 ? (
          <>
            <EmptyState
              icon={<Package className="text-muted-foreground size-8" />}
              title="아직 제보한 가격이 없습니다"
              description="첫 가격 제보로 다른 사용자에게 도움을 주세요."
            />
            <div className="mt-4 flex justify-center">
              <Button asChild>
                <Link href="/reports/new">가격 제보하러 가기</Link>
              </Button>
            </div>
          </>
        ) : (
          <ul className="bg-card border-border divide-border divide-y overflow-hidden border">
            {reports.map((report) => (
              <li key={report.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{report.pharmacy.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {report.drug.displayName} · {report.drug.packageUnit} · {report.purchasedAt}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="price text-sm font-semibold">{formatPrice(report.price)}</span>
                  <StatusBadge status={report.status} flagged={report.flagged} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
