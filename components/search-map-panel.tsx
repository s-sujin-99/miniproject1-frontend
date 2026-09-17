'use client';

import { PharmacyMap } from '@/components/pharmacy-map';
import { usePharmacySearch } from '@/lib/pharmacy-search-context';
import type { SearchResultItem } from '@/types/search';

// ROADMAP T-22 — 검색 결과 화면 맨 위(제목 위)에 배치되는 전체 폭 지도 배너.
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
