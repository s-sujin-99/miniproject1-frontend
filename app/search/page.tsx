import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorPanel } from '@/components/error-panel';
import { SearchMapPanel } from '@/components/search-map-panel';
import { SearchResults } from '@/components/search-results';
import { SortToggle } from '@/components/sort-toggle';
import { ApiError, apiFetch } from '@/lib/api';
import { formatDistance, formatPrice } from '@/lib/format';
import { PharmacySearchProvider } from '@/lib/pharmacy-search-context';
import { buildSearchUrl } from '@/lib/search-url';
import type { SearchResponse } from '@/types/search';

interface SearchPageSearchParams {
  drugId?: string;
  lat?: string;
  lng?: string;
  regionCode?: string;
  radius?: string;
  sort?: string;
}

// ROADMAP T-18 — 데모의 핵심 화면. 서버 컴포넌트에서 GET /api/v1/search를 직접 SSR한다.
// 정렬·반경은 URL 쿼리로만 관리해 공유/새로고침/뒤로가기가 전부 검색 조건을 복원하게 한다.
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchPageSearchParams>;
}) {
  const params = await searchParams;
  const drugId = params.drugId;
  const lat = params.lat;
  const lng = params.lng;
  const regionCode = params.regionCode;
  const radius = params.radius ?? '2000';
  const sort = params.sort ?? 'SCORE';

  if (!drugId || (!(lat && lng) && !regionCode)) {
    return (
      <ErrorPanel
        title="검색 조건이 올바르지 않습니다"
        description="약과 위치를 먼저 선택해주세요."
      />
    );
  }

  const current = { drugId, lat, lng, regionCode, radius, sort };

  const query = new URLSearchParams();
  query.set('drugId', drugId);
  if (lat) query.set('lat', lat);
  if (lng) query.set('lng', lng);
  if (regionCode) query.set('regionCode', regionCode);
  query.set('radius', radius);
  query.set('sort', sort);

  let data: SearchResponse;
  try {
    data = await apiFetch<SearchResponse>(`/api/v1/search?${query.toString()}`, {
      cache: 'no-store',
    });
  } catch (e) {
    const message = e instanceof ApiError ? e.message : '검색 중 오류가 발생했습니다.';
    return <ErrorPanel title="검색에 실패했습니다" description={message} />;
  }

  const { drug, summary, dataSource, results, suggestion } = data;

  return (
    <PharmacySearchProvider>
      <div className="mx-auto max-w-5xl px-4 py-6">
        {results.length > 0 && (
          <div className="mb-4">
            <SearchMapPanel
              center={{ lat: data.query.lat, lng: data.query.lng }}
              results={results}
            />
          </div>
        )}

        <div className="mb-4">
          <h1 className="text-xl font-semibold">{drug.displayName}</h1>
          <p className="text-muted-foreground text-sm">
            반경 {formatDistance(Number(radius))} 내 {summary.resultCount}곳
            {summary.maxSaving != null && summary.maxSaving > 0 && (
              <> · 최대 {formatPrice(summary.maxSaving)} 절약 가능</>
            )}
          </p>
        </div>

        {(dataSource === 'SEED' || dataSource === 'MIXED') && (
          <div className="bg-muted text-muted-foreground mb-4 rounded-lg px-4 py-2 text-xs">
            이 결과에는 학습용 예시 데이터가 포함되어 있습니다.
          </div>
        )}

        <SortToggle current={current} />

        {results.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="반경 내에 결과가 없습니다"
              description={
                suggestion
                  ? `반경을 ${formatDistance(suggestion.recommendedRadius)}로 넓히면 ${suggestion.estimatedCount}곳이 있습니다.`
                  : '다른 조건으로 다시 검색해보세요.'
              }
            />
            {suggestion && (
              <div className="mt-4 flex justify-center">
                <Button asChild>
                  <Link
                    href={buildSearchUrl(current, {
                      radius: String(suggestion.recommendedRadius),
                    })}
                  >
                    반경 {formatDistance(suggestion.recommendedRadius)}로 넓히기
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <SearchResults results={results} />
        )}
      </div>
    </PharmacySearchProvider>
  );
}
