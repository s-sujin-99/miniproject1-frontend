import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistance, formatPrice } from '@/lib/format';
import type { ResultBadge, SearchResultItem } from '@/types/search';

const BADGE_LABEL: Record<ResultBadge, string> = {
  LOWEST_PRICE: '최저가',
  LOW_CONFIDENCE: '정보 부족',
  STALE_DATA: '오래된 정보',
  NEAREST: '가장 가까움',
};

// ROADMAP T-18 — 1위(recommended) 카드는 강조 테두리 + "최저가 추천" 뱃지로 구분한다.
// active(ROADMAP T-22)는 지도 마커 hover/click과 연동되는 별도 강조로, recommended와 독립적으로 겹쳐 표시될 수 있다.
export function PharmacyResultCard({ item, active }: { item: SearchResultItem; active?: boolean }) {
  const { pharmacy, price, distanceM, badges, recommended } = item;
  // LOWEST_PRICE는 recommended 카드에만 붙는 뱃지라 상단 리본과 의미가 겹친다 — 칩에서는 뺀다.
  const chipBadges = badges.filter((badge) => badge !== 'LOWEST_PRICE');

  return (
    <Link
      href={`/pharmacies/${pharmacy.id}`}
      className={cn(
        'bg-card block border p-4 transition-colors',
        recommended
          ? 'border-primary border-l-4 hover:bg-primary/5'
          : 'border-border hover:bg-muted/50',
        active && !recommended && 'border-primary/60 bg-muted/50',
      )}
    >
      {recommended && <span className="rx-tag mb-2">최저가 추천</span>}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{pharmacy.name}</p>
          {pharmacy.addressRoad && (
            <p className="text-muted-foreground truncate text-xs">{pharmacy.addressRoad}</p>
          )}
        </div>
        <span className="price bg-muted shrink-0 px-2 py-0.5 text-xs">
          {formatDistance(distanceM)}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="price text-2xl font-semibold">{formatPrice(price.repPrice)}</span>
        {price.minPrice < price.repPrice && (
          <span className="price text-muted-foreground text-sm">
            최저 {formatPrice(price.minPrice)}
          </span>
        )}
      </div>

      {price.savingVsCandidateAvg > 0 && (
        <p className="text-secondary mt-1 text-sm font-medium">
          평균보다 {formatPrice(price.savingVsCandidateAvg)} 저렴
        </p>
      )}

      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span>제보 {price.reportCount}건</span>
        <span>
          {price.daysSinceLastReport === 0 ? '오늘 갱신' : `${price.daysSinceLastReport}일 전 갱신`}
        </span>
      </div>

      {chipBadges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {chipBadges.map((badge) => (
            <span
              key={badge}
              className="border-border text-muted-foreground border px-1.5 py-0.5 text-xs"
            >
              {BADGE_LABEL[badge]}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
