'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// 핵심 흐름의 진입점(ROADMAP T-16) — GPS로 좌표를 얻고 실패하면 지역 선택으로 폴백한다.
export type LocationState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'granted'; lat: number; lng: number }
  | {
      status: 'fallback';
      lat: number;
      lng: number;
      regionCode: string;
      sido: string;
      sigungu: string;
    }
  | { status: 'denied' }
  | { status: 'unavailable' };

export interface SelectedRegion {
  code: string;
  sido: string;
  sigungu: string;
  centerLat: number;
  centerLng: number;
}

interface UserLocationContextValue {
  state: LocationState;
  isPickerOpen: boolean;
  requestLocation: () => void;
  selectRegion: (region: SelectedRegion) => void;
  openPicker: () => void;
  closePicker: () => void;
}

const UserLocationContext = createContext<UserLocationContextValue | null>(null);

const STORAGE_KEY = 'pharmaprice:user-location';
const GEOLOCATION_OPTIONS: PositionOptions = { enableHighAccuracy: false, timeout: 8000 };

function readCachedLocation(): LocationState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocationState;
    return parsed.status === 'granted' || parsed.status === 'fallback' ? parsed : null;
  } catch {
    // 시크릿 모드 등에서 sessionStorage 접근이 막혀도 크래시 없이 매번 새로 요청한다.
    return null;
  }
}

function persistLocation(state: LocationState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장 실패는 무시 — 다음 GPS 요청/지역 선택으로 계속 동작한다.
  }
}

// navigator.geolocation을 감싼 순수 콜백 — React state는 건드리지 않는다(setState는 호출부 책임).
function startGeolocation(onResolved: (state: LocationState) => void) {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    onResolved({ status: 'unavailable' });
    return;
  }
  // 브라우저 권한 팝업을 사용자가 방치하면 getCurrentPosition의 timeout 옵션이 발동하지 않는
  // 경우가 실제로 있다(Chrome에서 재현 확인) — 직접 워치독을 둬 8초 안에는 반드시 폴백한다.
  const watchdog = setTimeout(
    () => onResolved({ status: 'unavailable' }),
    GEOLOCATION_OPTIONS.timeout,
  );
  navigator.geolocation.getCurrentPosition(
    (position) => {
      clearTimeout(watchdog);
      onResolved({
        status: 'granted',
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (error) => {
      clearTimeout(watchdog);
      onResolved({ status: error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable' });
    },
    GEOLOCATION_OPTIONS,
  );
}

export function UserLocationProvider({ children }: { children: React.ReactNode }) {
  // 서버는 sessionStorage가 없으므로 초기 렌더는 항상 'idle'로 고정한다 — 그렇지 않으면 서버가
  // 그린 'idle' 화면과 캐시를 읽은 클라이언트 첫 렌더가 달라져 하이드레이션 에러가 난다.
  const [state, setState] = useState<LocationState>({ status: 'idle' });
  const [isPickerOpen, setPickerOpen] = useState(false);

  const handleResolved = useCallback((next: LocationState) => {
    setState(next);
    if (next.status === 'granted' || next.status === 'fallback') {
      persistLocation(next);
      setPickerOpen(false);
    } else if (next.status === 'denied' || next.status === 'unavailable') {
      setPickerOpen(true);
    }
  }, []);

  const requestLocation = useCallback(() => {
    setState({ status: 'requesting' });
    startGeolocation(handleResolved);
  }, [handleResolved]);

  const selectRegion = useCallback(
    (region: SelectedRegion) => {
      handleResolved({
        status: 'fallback',
        lat: region.centerLat,
        lng: region.centerLng,
        regionCode: region.code,
        sido: region.sido,
        sigungu: region.sigungu,
      });
    },
    [handleResolved],
  );

  useEffect(() => {
    // 마운트 이후(=클라이언트 전용 시점)에만 sessionStorage/GPS에 접근한다. 캐시가 있으면
    // 그대로 복원하고, 없으면 새로 요청한다 — 둘 다 외부(브라우저) 상태를 읽어오는 것이라
    // 여기서 setState하는 것이 올바른 패턴이다(리액트 state로부터 파생 가능한 값이 아님).
    const cached = readCachedLocation();
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 전용 캐시를 마운트 직후 1회 복원
      setState(cached);
      return;
    }
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 1회만 실행한다
  }, []);

  const value: UserLocationContextValue = {
    state,
    isPickerOpen,
    requestLocation,
    selectRegion,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),
  };

  return <UserLocationContext.Provider value={value}>{children}</UserLocationContext.Provider>;
}

export function useUserLocation(): UserLocationContextValue {
  const ctx = useContext(UserLocationContext);
  if (!ctx) {
    throw new Error('useUserLocation은 UserLocationProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}

/** 검색 API 호출에 바로 쓸 수 있는 좌표+출처. 위치가 아직 없으면 null. */
export function getResolvedCoordinates(
  state: LocationState,
): { lat: number; lng: number; source: 'GPS' | 'REGION' } | null {
  if (state.status === 'granted') return { lat: state.lat, lng: state.lng, source: 'GPS' };
  if (state.status === 'fallback') return { lat: state.lat, lng: state.lng, source: 'REGION' };
  return null;
}
