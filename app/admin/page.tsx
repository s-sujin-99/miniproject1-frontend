'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  MessageSquareText,
  Percent,
  Pill as PillIcon,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { ErrorPanel } from '@/components/error-panel';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatThousands } from '@/lib/format';
import type { AdminOverviewResponse, AdminTopReportersResponse } from '@/types/admin';

function KpiCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-card flex items-center gap-3 rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="bg-accent text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="price mt-0.5 text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

// 커버리지는 (약국 × 약품) 조합 수 대비라 분모가 매우 커서 실제 값이 있어도 정수%로 반올림하면
// 0%로 보인다 — 1% 미만일 때만 소수점을 보여줘 "정말 0"과 "아직 작음"을 구분한다.
function formatCoverageRate(rate: number): string {
  const pct = rate * 100;
  if (pct > 0 && pct < 1) return `${pct.toFixed(2)}%`;
  return `${Math.round(pct)}%`;
}

const COLLAPSED_REPORTER_COUNT = 3;

// ROADMAP T-31 확장 — 제보자별 제보수 순위. REJECTED 전환된 제보는 집계에서 빠진다(API.md §8).
function TopReportersList() {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stats', 'top-reporters'],
    queryFn: () =>
      apiFetch<AdminTopReportersResponse>('/api/v1/admin/stats/top-reporters?limit=10', {
        auth: true,
      }),
  });

  const rows = data?.rows ?? [];
  const visibleRows = expanded ? rows : rows.slice(0, COLLAPSED_REPORTER_COUNT);

  return (
    <div className="bg-card mt-6 rounded-2xl p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-medium">제보자 순위</h2>
      {isError ? (
        <ErrorState
          title="제보자 순위를 불러오지 못했습니다"
          description="잠시 후 다시 시도해주세요."
        />
      ) : isLoading || !data ? (
        <p className="text-muted-foreground text-sm">불러오는 중...</p>
      ) : rows.length === 0 ? (
        <EmptyState title="아직 제보자 데이터가 없습니다" />
      ) : (
        <>
          <ul className="divide-border divide-y">
            {visibleRows.map((row, i) => (
              <li key={row.reporter.id} className="flex items-center gap-3 py-2.5">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    i < 3 ? 'bg-accent text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.reporter.nickname}</p>
                  <p className="text-muted-foreground truncate text-xs">{row.reporter.email}</p>
                </div>
                <p className="price shrink-0 text-sm font-bold">
                  {formatThousands(row.reportCount)}건
                </p>
              </li>
            ))}
          </ul>
          {rows.length > COLLAPSED_REPORTER_COUNT && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? '접기' : `더보기 (${rows.length - COLLAPSED_REPORTER_COUNT})`}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function formatShortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${month}/${day}`;
}

// recharts의 Tooltip content 제네릭이 버전마다 까다로워, 실제로 쓰는 필드만 최소로 타입을 잡는다
// (components/price-history-chart.tsx와 같은 이유).
interface TrendTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}

function TrendTooltip({ active, payload }: TrendTooltipProps) {
  const point = payload?.[0]?.payload as { date: string; reportCount: number } | undefined;
  if (!active || !point) return null;
  return (
    <div className="bg-popover border-border rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{point.date}</p>
      <p>{formatThousands(point.reportCount)}건</p>
    </div>
  );
}

// ROADMAP T-33 — /admin. ADMIN 가드는 app/admin/layout.tsx가 공통으로 처리한다.
export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stats', 'overview'],
    queryFn: () => apiFetch<AdminOverviewResponse>('/api/v1/admin/stats/overview', { auth: true }),
  });

  if (isError) {
    return (
      <ErrorPanel title="통계를 불러오지 못했습니다" description="잠시 후 다시 시도해주세요." />
    );
  }
  if (isLoading || !data) {
    return <p className="text-muted-foreground text-sm">불러오는 중...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">관리자 대시보드</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <KpiCard
          icon={<Building2 className="size-5" />}
          label="약국 수"
          value={formatThousands(data.totals.pharmacyCount)}
        />
        <KpiCard
          icon={<PillIcon className="size-5" />}
          label="약품 수"
          value={formatThousands(data.totals.drugCount)}
        />
        <KpiCard
          icon={<MessageSquareText className="size-5" />}
          label="제보 수"
          value={formatThousands(data.totals.reportCount)}
        />
        <KpiCard
          icon={<Percent className="size-5" />}
          label="커버리지"
          value={formatCoverageRate(data.coverageRate)}
        />
        <KpiCard
          icon={<AlertTriangle className="size-5" />}
          label="이상치 제보"
          value={formatThousands(data.flaggedReportCount)}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="bg-card mt-8 rounded-2xl p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium">최근 7일 제보 추이</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.recentTrend} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              fontSize={11}
              stroke="var(--muted-foreground)"
              tickLine={false}
            />
            <YAxis
              width={40}
              fontSize={11}
              stroke="var(--muted-foreground)"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={TrendTooltip} />
            <Line
              type="monotone"
              dataKey="reportCount"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <TopReportersList />
    </div>
  );
}
