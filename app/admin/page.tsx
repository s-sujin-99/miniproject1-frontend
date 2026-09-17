'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorPanel } from '@/components/error-panel';
import { apiFetch } from '@/lib/api';
import { formatThousands } from '@/lib/format';
import type { AdminOverviewResponse } from '@/types/admin';

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border rounded-lg border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
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
      <h1 className="text-xl font-semibold">관리자 대시보드</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <KpiCard label="약국 수" value={formatThousands(data.totals.pharmacyCount)} />
        <KpiCard label="약품 수" value={formatThousands(data.totals.drugCount)} />
        <KpiCard label="제보 수" value={formatThousands(data.totals.reportCount)} />
        <KpiCard label="커버리지" value={`${Math.round(data.coverageRate * 100)}%`} />
        <KpiCard label="이상치 제보" value={formatThousands(data.flaggedReportCount)} />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-medium">최근 7일 제보 추이</h2>
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
  );
}
