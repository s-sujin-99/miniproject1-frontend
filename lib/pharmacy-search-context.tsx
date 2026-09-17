'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

interface PharmacySearchContextValue {
  activeId: number | null;
  setActiveId: Dispatch<SetStateAction<number | null>>;
  registerItemRef: (pharmacyId: number, el: HTMLLIElement | null) => void;
  handleMarkerClick: (pharmacyId: number) => void;
}

const PharmacySearchContext = createContext<PharmacySearchContextValue | null>(null);

// 지도(상단, search-map-panel)와 목록(하단, search-results)이 서로 다른 위치에 떨어져 렌더되면서도
// hover/click 상태(activeId)를 공유해야 해서 컨텍스트로 뺐다(ROADMAP T-22의 화면 배치 변경).
export function PharmacySearchProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const itemRefs = useRef(new Map<number, HTMLLIElement>());

  const registerItemRef = useCallback((pharmacyId: number, el: HTMLLIElement | null) => {
    if (el) itemRefs.current.set(pharmacyId, el);
    else itemRefs.current.delete(pharmacyId);
  }, []);

  const handleMarkerClick = useCallback((pharmacyId: number) => {
    setActiveId(pharmacyId);
    itemRefs.current.get(pharmacyId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <PharmacySearchContext.Provider
      value={{ activeId, setActiveId, registerItemRef, handleMarkerClick }}
    >
      {children}
    </PharmacySearchContext.Provider>
  );
}

export function usePharmacySearch(): PharmacySearchContextValue {
  const ctx = useContext(PharmacySearchContext);
  if (!ctx) {
    throw new Error('usePharmacySearch는 PharmacySearchProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}
