'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPrice } from '@/lib/format';
import type { PricePoint } from '@/types/pharmacy';

function formatShortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${month}/${day}`;
}

function formatCompactPrice(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}만` : `${Math.round(n / 100) / 10}천`;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: PricePoint;
}

// flagged 점은 형태(점선 테두리)로 구분한다 — 색상만으로 정보를 전달하지 않는다(ROADMAP T-21 #6).
function PricePointDot({ cx, cy, payload }: DotProps) {
  if (cx == null || cy == null || !payload) return null;
  if (payload.flagged) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="var(--background)"
        stroke="var(--muted-foreground)"
        strokeWidth={2}
        strokeDasharray="2 2"
      />
    );
  }
  return <circle cx={cx} cy={cy} r={4} fill="var(--primary)" />;
}

// recharts의 Tooltip content 제네릭이 버전마다 까다로워, 실제로 쓰는 필드만 최소로 타입을 잡는다.
interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  const point = payload?.[0]?.payload as PricePoint | undefined;
  if (!active || !point) return null;
  return (
    <div className="bg-popover border-border rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{point.purchasedAt}</p>
      <p>{formatPrice(point.price)}</p>
      {point.flagged && <p className="text-muted-foreground mt-1">통계에서 제외된 제보</p>}
    </div>
  );
}

// 이력이 1건뿐이어도 깨지지 않아야 한다(ROADMAP T-21 #7) — category축 LineChart는 점 1개도 그대로 렌더링한다.
export function PriceHistoryChart({ points }: { points: PricePoint[] }) {
  if (points.length === 0) {
    return (
      <p className="text-muted-foreground px-1 py-6 text-center text-sm">가격 이력이 없습니다.</p>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="purchasedAt"
            tickFormatter={formatShortDate}
            fontSize={11}
            stroke="var(--muted-foreground)"
            tickLine={false}
          />
          <YAxis
            width={40}
            tickFormatter={formatCompactPrice}
            fontSize={11}
            stroke="var(--muted-foreground)"
            tickLine={false}
            axisLine={false}
            domain={['dataMin - 100', 'dataMax + 100']}
          />
          <Tooltip content={ChartTooltip} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={<PricePointDot />}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-muted-foreground mt-1 flex items-center gap-3 px-1 text-xs">
        <span className="flex items-center gap-1">
          <span className="bg-primary inline-block size-2 rounded-full" /> 제보 가격
        </span>
        <span className="flex items-center gap-1">
          <span className="border-muted-foreground inline-block size-2 rounded-full border border-dashed" />{' '}
          통계 제외(이상치)
        </span>
      </p>
    </div>
  );
}
