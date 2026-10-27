import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorPanel } from '@/components/error-panel';
import { SearchMapPanel } from '@/components/search-map-panel';
import { SearchResults } from '@/components/search-results';
import { SortToggle } from '@/components/sort-toggle';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
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
    return <ErrorPanel title="검색에 실패했습니다" description={getErrorMessage(e)} />;
  }

  const { drug, summary, dataSource, results, suggestion } = data;

  return (
    <PharmacySearchProvider>
      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="lg:grid lg:grid-cols-[1fr_400px] lg:items-start lg:gap-6">
            {results.length > 0 && (
              // 모바일: 상단 전체 폭 배너. lg+: 오른쪽 sticky 패널로 재배치(order만 바뀔 뿐
              // DOM 순서는 그대로라 지도가 먼저 읽힌다).
              <div className="mb-4 h-64 md:h-80 lg:order-2 lg:sticky lg:top-20 lg:mb-0 lg:h-[calc(100vh-6rem)]">
                <SearchMapPanel
                  center={{ lat: data.query.lat, lng: data.query.lng }}
                  results={results}
                />
              </div>
            )}

            <div className="min-w-0 lg:order-1">
              <div className="mb-4">
                <h1 className="text-foreground text-2xl font-black tracking-tight">
                  {drug.displayName}
                </h1>
                <p className="text-muted-foreground text-sm">
                  반경 {formatDistance(Number(radius))} 내 {summary.resultCount}곳
                  {summary.maxSaving != null && summary.maxSaving > 0 && (
                    <>
                      {' · 최대 '}
                      <span className="price text-secondary font-semibold">
                        {formatPrice(summary.maxSaving)}
                      </span>
                      {' 절약 가능'}
                    </>
                  )}
                </p>
              </div>

              {(dataSource === 'SEED' || dataSource === 'MIXED') && (
                <div className="bg-accent text-accent-foreground border-border mb-4 border px-4 py-2.5 text-xs">
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
          </div>
        </div>
      </div>
    </PharmacySearchProvider>
  );
}
