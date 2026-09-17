'use client';

import { MapPin, LocateFixed } from 'lucide-react';
import { useUserLocation } from '@/hooks/use-user-location';
import { Button } from '@/components/ui/button';

// 헤더에 현재 위치 출처(GPS/지역)를 표시하고, 클릭하면 지역 선택 모달을 다시 연다(ROADMAP T-16).
export function LocationIndicator() {
  const { state, openPicker } = useUserLocation();

  const label = (() => {
    switch (state.status) {
      case 'granted':
        return '현재 위치';
      case 'fallback':
        return `${state.sido} ${state.sigungu}`;
      case 'denied':
      case 'unavailable':
        return '위치 미설정';
      case 'requesting':
      case 'idle':
      default:
        return '위치 확인 중...';
    }
  })();

  return (
    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <MapPin className="size-3.5" aria-hidden />
      <span>{label}</span>
      <Button variant="ghost" size="icon-xs" onClick={openPicker} aria-label="위치 변경">
        <LocateFixed className="size-3" />
      </Button>
    </div>
  );
}
