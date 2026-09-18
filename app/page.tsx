'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DrugAutocomplete } from '@/components/drug-autocomplete';
import { RecentReportsFeed } from '@/components/recent-reports-feed';
import { getResolvedCoordinates, useUserLocation } from '@/hooks/use-user-location';
import type { DrugSummary } from '@/types/drug';

// ROADMAP T-17 — 실제 시드 데이터에 존재하는 이름만 골랐다(존재하지 않는 이름은 클릭해도 결과가 없다).
const POPULAR_DRUGS = [
  '타이레놀',
  '게보린',
  '판콜에이',
  '베아제',
  '부루펜',
  '챔프시럽',
  '훼스탈골드',
  '판피린큐',
];

export default function Home() {
  const router = useRouter();
  const { state, isPickerOpen, requestLocation, openPicker } = useUserLocation();
  const [pendingDrug, setPendingDrug] = useState<DrugSummary | null>(null);
  const [quickQuery, setQuickQuery] = useState('');

  function goToSearch(drug: DrugSummary) {
    const coords = getResolvedCoordinates(state);
    if (coords) {
      router.push(`/search?drugId=${drug.id}&lat=${coords.lat}&lng=${coords.lng}&radius=2000`);
      return;
    }
    // 위치가 아직 없으면 T-16 훅을 먼저 태우고, 위치가 정해지는 대로 아래 effect가 이동을 이어받는다.
    setPendingDrug(drug);
    if (state.status === 'idle') {
      requestLocation();
    } else if (state.status === 'denied' || state.status === 'unavailable') {
      openPicker();
    }
  }

  useEffect(() => {
    // router.push는 렌더 중에 호출할 수 없는 진짜 부수효과라 effect가 맞는 자리다.
    // setPendingDrug은 그 부수효과에 딸린 뒷정리일 뿐이라 별도 파생 상태로 뺄 수 없다.
    if (!pendingDrug) return;
    const coords = getResolvedCoordinates(state);
    if (coords) {
      router.push(
        `/search?drugId=${pendingDrug.id}&lat=${coords.lat}&lng=${coords.lng}&radius=2000`,
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect -- router.push 뒷정리
      setPendingDrug(null);
      return;
    }
    if (!isPickerOpen && (state.status === 'denied' || state.status === 'unavailable')) {
      // 사용자가 지역 선택 모달을 닫아버렸다 — 대기 중이던 이동을 취소한다.
      setPendingDrug(null);
    }
  }, [state, isPickerOpen, pendingDrug, router]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-8 px-4 py-16 sm:py-24">
      <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center gap-3 text-center duration-700 ease-out">
        <h1 className="text-foreground text-3xl leading-tight font-black tracking-tight text-balance sm:text-4xl">
          약 이름으로
          <br />
          최저가를 찾아보세요
        </h1>
        <p className="text-muted-foreground text-sm">주변 약국의 실제 판매가를 비교해드려요</p>
      </div>

      <div
        className="animate-in fade-in slide-in-from-bottom-3 w-full duration-700 ease-out [animation-delay:150ms] [animation-fill-mode:backwards]"
        key={quickQuery}
      >
        <DrugAutocomplete onSelect={goToSearch} initialQuery={quickQuery} autoFocus />
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {POPULAR_DRUGS.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={() => setQuickQuery(name)}
            style={{ animationDelay: `${300 + i * 60}ms` }}
            className="animate-in fade-in slide-in-from-bottom-2 bg-muted text-foreground hover:bg-accent hover:text-accent-foreground rounded-full px-3 py-1.5 text-sm font-medium duration-500 ease-out [animation-fill-mode:backwards] hover:scale-105 active:scale-95 transition-[background-color,color,transform]"
          >
            {name}
          </button>
        ))}
      </div>

      {pendingDrug && (
        <p className="price text-muted-foreground animate-pulse text-xs">
          위치를 확인하는 중입니다...
        </p>
      )}

      <div className="animate-in fade-in w-full duration-700 ease-out [animation-delay:450ms] [animation-fill-mode:backwards]">
        <RecentReportsFeed />
      </div>
    </div>
  );
}
