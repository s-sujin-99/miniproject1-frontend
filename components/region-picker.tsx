'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useUserLocation } from '@/hooks/use-user-location';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { RegionGroup } from '@/types/region';

// 위치 권한 거부/타임아웃/미지원 시 폴백 — 시/도 → 시/군/구 2단 선택(ROADMAP T-16, API.md §7).
export function RegionPicker() {
  const { state, isPickerOpen, closePicker, selectRegion } = useUserLocation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['regions'],
    queryFn: () => apiFetch<RegionGroup[]>('/api/v1/regions'),
    enabled: isPickerOpen,
    staleTime: 60 * 60 * 1000, // 백엔드 Cache-Control: max-age=3600과 맞춘다
  });

  const [sido, setSido] = useState('');
  const [sigunguCode, setSigunguCode] = useState('');

  const sigungus = useMemo(() => data?.find((g) => g.sido === sido)?.sigungus ?? [], [data, sido]);
  const picked = sigungus.find((s) => s.code === sigunguCode);

  function handleConfirm() {
    if (!picked) return;
    selectRegion({
      code: picked.code,
      sido,
      sigungu: picked.sigungu,
      centerLat: picked.centerLat,
      centerLng: picked.centerLng,
    });
    setSido('');
    setSigunguCode('');
  }

  return (
    <Dialog open={isPickerOpen} onOpenChange={(open) => !open && closePicker()}>
      <DialogContent>
        <DialogTitle>지역을 선택해주세요</DialogTitle>
        <DialogDescription>
          {state.status === 'denied'
            ? '위치 권한이 거부되어 지역을 직접 선택해야 검색할 수 있습니다.'
            : '내 위치를 확인할 수 없습니다. 지역을 선택해주세요.'}
        </DialogDescription>

        {isLoading && (
          <p className="text-muted-foreground py-6 text-center text-sm">
            지역 목록을 불러오는 중...
          </p>
        )}
        {isError && (
          <p className="text-destructive py-6 text-center text-sm">
            지역 목록을 불러오지 못했습니다.
          </p>
        )}

        {data && (
          <div className="flex flex-col gap-3 py-2">
            <select
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={sido}
              onChange={(e) => {
                setSido(e.target.value);
                setSigunguCode('');
              }}
            >
              <option value="">시/도 선택</option>
              {data.map((g) => (
                <option key={g.sido} value={g.sido}>
                  {g.sido}
                </option>
              ))}
            </select>

            <select
              className="border-input bg-background h-9 rounded-md border px-3 text-sm disabled:opacity-50"
              value={sigunguCode}
              onChange={(e) => setSigunguCode(e.target.value)}
              disabled={!sido}
            >
              <option value="">시/군/구 선택</option>
              {sigungus.map((s) => (
                <option key={s.code} value={s.code} disabled={s.pharmacyCount === 0}>
                  {s.sigungu}
                  {s.pharmacyCount === 0 ? ' (등록된 약국 없음)' : ''}
                </option>
              ))}
            </select>

            <Button onClick={handleConfirm} disabled={!picked}>
              이 지역으로 검색하기
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
