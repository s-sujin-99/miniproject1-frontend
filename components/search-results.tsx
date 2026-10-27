'use client';

import { PharmacyResultCard } from '@/components/pharmacy-result-card';
import { usePharmacySearch } from '@/lib/pharmacy-search-context';
import type { SearchResultItem } from '@/types/search';

// ROADMAP T-22 — lg 이상에서는 지도(search-map-panel)가 오른쪽 sticky 패널로 붙고 이 목록이
// 왼쪽 컬럼을 스크롤한다. hover/click 상태는 PharmacySearchProvider(컨텍스트)로 지도와 공유한다.
export function SearchResults({ results }: { results: SearchResultItem[] }) {
  const { activeId, setActiveId, registerItemRef } = usePharmacySearch();

  return (
    <ul className="mt-4 flex flex-col gap-3">
      {results.map((item) => (
        <li
          key={item.pharmacy.id}
          ref={(el) => registerItemRef(item.pharmacy.id, el)}
          onMouseEnter={() => setActiveId(item.pharmacy.id)}
          onMouseLeave={() =>
            setActiveId((current) => (current === item.pharmacy.id ? null : current))
          }
        >
          <PharmacyResultCard item={item} active={activeId === item.pharmacy.id} />
        </li>
      ))}
    </ul>
  );
}
