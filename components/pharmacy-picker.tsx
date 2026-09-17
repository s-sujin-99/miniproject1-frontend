'use client';

import { useEffect, useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LocateFixed, MapPin, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDistance } from '@/lib/format';
import type { PageResponse } from '@/types/api';
import type { PharmacyPickResult } from '@/types/report';

interface PharmacyPickerProps {
  value: PharmacyPickResult | null;
  onChange: (pharmacy: PharmacyPickResult | null) => void;
}

// ROADMAP T-17(DrugAutocomplete)과 동일한 디바운스 콤보박스 패턴을 약국 검색에 맞게 적용한다.
const DEBOUNCE_MS = 300;

export function PharmacyPicker({ value, onChange }: PharmacyPickerProps) {
  const listboxId = useId();
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [nearby, setNearby] = useState<PharmacyPickResult[] | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(inputValue.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data, isFetching } = useQuery({
    queryKey: ['pharmacies', 'autocomplete', debouncedValue],
    queryFn: () =>
      apiFetch<PageResponse<PharmacyPickResult>>(
        `/api/v1/pharmacies?q=${encodeURIComponent(debouncedValue)}&size=8`,
      ),
    enabled: debouncedValue.length > 0,
    staleTime: 30_000,
  });

  const options = debouncedValue.length > 0 ? (data?.content ?? []) : [];
  const isDebouncePending = inputValue.trim() !== debouncedValue;
  const isLoading = debouncedValue.length > 0 && (isDebouncePending || isFetching);

  function select(pharmacy: PharmacyPickResult) {
    onChange(pharmacy);
    setInputValue('');
    setDebouncedValue('');
    setIsOpen(false);
    setNearby(null);
  }

  // "지도에서 고르기" 대신 내 위치 반경 2km 약국을 가까운 순 목록으로 보여준다.
  // ponytail: 실제 지도 클릭 선택(pharmacy-map.tsx처럼 kakao map 마커)은 범위를 넘어서 뺐다 —
  // 필요해지면 그 컴포넌트의 마커·bounds 로직을 재사용해 목록을 지도로 교체하면 된다.
  function findNearby() {
    if (!navigator.geolocation) {
      setNearbyError('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }
    setNearbyError(null);
    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        apiFetch<PageResponse<PharmacyPickResult>>(
          `/api/v1/pharmacies?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius=2000&size=10`,
        )
          .then((res) => {
            setNearby(res.content);
            setIsOpen(false);
          })
          .catch(() => setNearbyError('주변 약국을 불러오지 못했습니다.'))
          .finally(() => setNearbyLoading(false));
      },
      () => {
        setNearbyError('위치 권한을 허용해주세요.');
        setNearbyLoading(false);
      },
    );
  }

  if (value) {
    return (
      <div className="border-input bg-muted/30 flex items-center justify-between gap-2 rounded-lg border px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{value.name}</p>
          {value.addressRoad && (
            <p className="text-muted-foreground truncate text-xs">{value.addressRoad}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1"
          aria-label="약국 선택 취소"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full">
        <input
          type="text"
          role="combobox"
          aria-expanded={isOpen && inputValue.trim().length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          className="border-input bg-background focus-visible:ring-ring/50 h-11 w-full rounded-lg border px-4 text-sm outline-none focus-visible:ring-3"
          placeholder="약국 이름으로 검색"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
        />

        {isOpen && inputValue.trim().length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            className="bg-popover text-popover-foreground border-border absolute z-10 mt-1 w-full overflow-hidden rounded-lg border shadow-lg"
          >
            {isLoading ? (
              <li className="text-muted-foreground px-4 py-3 text-sm">검색 중...</li>
            ) : options.length === 0 ? (
              <li className="text-muted-foreground px-4 py-3 text-sm">검색 결과가 없습니다.</li>
            ) : (
              options.map((pharmacy) => (
                <li
                  key={pharmacy.id}
                  role="option"
                  aria-selected={false}
                  className="hover:bg-muted cursor-pointer px-4 py-2.5 text-sm"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(pharmacy)}
                >
                  <span className="font-medium">{pharmacy.name}</span>
                  {pharmacy.addressRoad && (
                    <span className="text-muted-foreground ml-1.5">{pharmacy.addressRoad}</span>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={findNearby}
        disabled={nearbyLoading}
        className="text-primary inline-flex w-fit items-center gap-1 text-xs hover:underline disabled:opacity-50"
      >
        <LocateFixed className="size-3.5" />
        {nearbyLoading ? '주변 약국 찾는 중...' : '내 주변 약국에서 찾기'}
      </button>
      {nearbyError && <p className="text-destructive text-xs">{nearbyError}</p>}

      {nearby && (
        <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
          {nearby.length === 0 ? (
            <li className="text-muted-foreground px-4 py-3 text-sm">
              반경 2km 이내 등록된 약국이 없습니다.
            </li>
          ) : (
            nearby.map((pharmacy) => (
              <li
                key={pharmacy.id}
                className="hover:bg-muted flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-sm"
                onClick={() => select(pharmacy)}
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="text-muted-foreground size-3.5 shrink-0" />
                  {pharmacy.name}
                </span>
                {pharmacy.distanceM != null && (
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatDistance(pharmacy.distanceM)}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
