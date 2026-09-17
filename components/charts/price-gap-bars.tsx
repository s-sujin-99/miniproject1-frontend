import { formatPrice } from '@/lib/format';
import type { AdminPriceGapRow } from '@/types/admin';

// ROADMAP T-34 — 가격 격차 Top N. recharts 대신 CSS 막대를 쓴다: gapPct 숫자만으론 의미가 없어
// 최저가·최고가 지역명을 함께 표시해야 하는데(#지침), 이건 다형 라벨보다 목록형 레이아웃이 더 간단하다.
// 1위(가장 큰 격차)만 강조색으로 표시한다("시리즈당 1색 + 강조 1개").
export function PriceGapBars({ rows }: { rows: AdminPriceGapRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">가격 격차 데이터가 없습니다.</p>
    );
  }
  const maxGapPct = Math.max(...rows.map((r) => r.gapPct));

  return (
    <ul className="space-y-4">
      {rows.map((row, index) => (
        <li key={row.drug.id}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">{row.drug.displayName}</span>
            <span className={index === 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
              {row.gapPct.toFixed(1)}%
            </span>
          </div>
          <div className="bg-muted mt-1.5 h-2 overflow-hidden rounded-full">
            <div
              className={
                index === 0 ? 'bg-primary h-full rounded-full' : 'bg-primary/60 h-full rounded-full'
              }
              style={{ width: `${(row.gapPct / maxGapPct) * 100}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            최저 {row.cheapestRegion.sido} {row.cheapestRegion.sigungu}{' '}
            {formatPrice(row.cheapestRegion.avgPrice)} · 최고 {row.priciestRegion.sido}{' '}
            {row.priciestRegion.sigungu} {formatPrice(row.priciestRegion.avgPrice)}
          </p>
        </li>
      ))}
    </ul>
  );
}
