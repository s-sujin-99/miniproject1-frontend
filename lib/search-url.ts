// /search 페이지의 정렬·반경 토글이 공유하는 URL 빌더. 뒤로가기가 검색 조건을 복원하려면
// 모든 상태 변경이 router.push로 새 URL을 쌓는 방식이어야 한다(ROADMAP T-18).
export interface SearchUrlParams {
  drugId: string;
  lat?: string;
  lng?: string;
  regionCode?: string;
  radius: string;
  sort: string;
}

export function buildSearchUrl(
  current: SearchUrlParams,
  overrides: Partial<SearchUrlParams>,
): string {
  const merged = { ...current, ...overrides };
  const params = new URLSearchParams();
  params.set('drugId', merged.drugId);
  if (merged.lat) params.set('lat', merged.lat);
  if (merged.lng) params.set('lng', merged.lng);
  if (merged.regionCode) params.set('regionCode', merged.regionCode);
  params.set('radius', merged.radius);
  params.set('sort', merged.sort);
  return `/search?${params.toString()}`;
}
