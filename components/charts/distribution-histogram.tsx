'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatThousands } from '@/lib/format';
import type { AdminDrugStatsResponse } from '@/types/admin';

type Bucket = AdminDrugStatsResponse['distribution'][number];

function bucketLabel(b: Bucket): string {
  return `${formatThousands(b.bucketFrom)}~${formatThousands(b.bucketTo)}`;
}

interface HistogramTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}

function HistogramTooltip({ active, payload }: HistogramTooltipProps) {
  const point = payload?.[0]?.payload as Bucket | undefined;
  if (!active || !point) return null;
  return (
    <div className="bg-popover border-border rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{bucketLabel(point)}원</p>
      <p>{formatThousands(point.count)}건</p>
    </div>
  );
}

// ROADMAP T-34 — 약품 가격 분포 히스토그램. price-history-chart.tsx와 같은 custom Tooltip 패턴.
export function DistributionHistogram({ distribution }: { distribution: Bucket[] }) {
  if (distribution.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">가격 분포 데이터가 없습니다.</p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={distribution} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey={bucketLabel}
          fontSize={11}
          stroke="var(--muted-foreground)"
          tickLine={false}
        />
        <YAxis
          width={32}
          allowDecimals={false}
          fontSize={11}
          stroke="var(--muted-foreground)"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={HistogramTooltip} />
        <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
