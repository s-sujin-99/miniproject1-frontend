'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPrice, formatThousands } from '@/lib/format';
import type { AdminDrugStatsResponse } from '@/types/admin';

type RegionAvg = AdminDrugStatsResponse['byRegion'][number];

interface RegionAvgTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}

function RegionAvgTooltip({ active, payload }: RegionAvgTooltipProps) {
  const point = payload?.[0]?.payload as RegionAvg | undefined;
  if (!active || !point) return null;
  return (
    <div className="bg-popover border-border rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="font-medium">
        {point.sido} {point.sigungu}
      </p>
      <p>
        {formatPrice(point.avgPrice)} · 약국 {point.pharmacyCount}곳
      </p>
    </div>
  );
}

// ROADMAP T-34 — 선택한 약품의 지역별 평균가 가로 막대. 수치 라벨을 막대 옆에 병기한다(#지침).
export function RegionAvgBarChart({ byRegion }: { byRegion: RegionAvg[] }) {
  if (byRegion.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        지역별 평균가 데이터가 없습니다.
      </p>
    );
  }
  const height = Math.max(160, byRegion.length * 28);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={byRegion}
        layout="vertical"
        margin={{ top: 8, right: 48, bottom: 0, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={formatThousands}
          fontSize={11}
          stroke="var(--muted-foreground)"
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="sigungu"
          width={64}
          fontSize={11}
          stroke="var(--muted-foreground)"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={RegionAvgTooltip} />
        <Bar
          dataKey="avgPrice"
          fill="var(--primary)"
          radius={[0, 4, 4, 0]}
          label={{
            position: 'right',
            fontSize: 11,
            fill: 'var(--muted-foreground)',
            formatter: (v) => formatThousands(Number(v)),
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
