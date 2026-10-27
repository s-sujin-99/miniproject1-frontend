'use client';

import { PharmacyMap } from '@/components/pharmacy-map';
import { usePharmacySearch } from '@/lib/pharmacy-search-context';
import type { SearchResultItem } from '@/types/search';

// ROADMAP T-22 — 모바일은 상단 배너, lg 이상은 리스트 옆에 붙는 sticky 사이드 패널이다
// (높이는 호출부 wrapper가 브레이크포인트별로 지정한다).
export function SearchMapPanel({
  center,
  results,
}: {
  center: { lat: number; lng: number };
  results: SearchResultItem[];
}) {
  const { activeId, handleMarkerClick } = usePharmacySearch();

  return (
    <PharmacyMap
      center={center}
      results={results}
      activeId={activeId}
      onMarkerClick={handleMarkerClick}
    />
  );
}
