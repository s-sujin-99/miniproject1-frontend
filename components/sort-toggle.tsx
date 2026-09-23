'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { buildSearchUrl, type SearchUrlParams } from '@/lib/search-url';

const SORT_OPTIONS = [
  { value: 'SCORE', label: '추천순' },
  { value: 'PRICE', label: '가격순' },
  { value: 'DISTANCE', label: '거리순' },
] as const;

const RADIUS_OPTIONS = [
  { value: '500', label: '500m' },
  { value: '1000', label: '1km' },
  { value: '2000', label: '2km' },
  { value: '5000', label: '5km' },
] as const;

// 정렬/반경 토글 — router.push로 URL을 바꿔 서버 컴포넌트(app/search/page.tsx)가 다시 SSR한다.
// push(replace 아님)라서 브라우저 뒤로가기로 이전 검색 조건이 그대로 복원된다.
export function SortToggle({ current }: { current: SearchUrlParams }) {
  const router = useRouter();

  return (
    <div className="bg-background border-border sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-b pb-3">
      <div className="flex gap-4">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => router.push(buildSearchUrl(current, { sort: opt.value }))}
            className={cn(
              'border-b-2 pb-1 text-sm font-bold transition-colors',
              current.sort === opt.value
                ? 'border-foreground text-foreground'
                : 'text-muted-foreground border-transparent hover:text-foreground',
            )}
            aria-pressed={current.sort === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {RADIUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => router.push(buildSearchUrl(current, { radius: opt.value }))}
            className={cn(
              'price border px-3 py-1.5 text-sm transition-colors',
              current.radius === opt.value
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
            aria-pressed={current.radius === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
