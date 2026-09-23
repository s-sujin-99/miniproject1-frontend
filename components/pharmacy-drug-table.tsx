'use client';

import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PriceHistoryChart } from '@/components/price-history-chart';
import { apiFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DrugPrice, PriceHistory } from '@/types/pharmacy';

// 약품 행을 펼칠 때만 이력을 조회한다 — 약국 하나가 취급하는 약품 수만큼 history를 한꺼번에 부르지 않는다(ROADMAP T-21 #3).
function DrugHistoryRow({ pharmacyId, drugId }: { pharmacyId: number; drugId: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pharmacy', pharmacyId, 'drug', drugId, 'history'],
    queryFn: () =>
      apiFetch<PriceHistory>(`/api/v1/pharmacies/${pharmacyId}/drugs/${drugId}/history`),
    staleTime: 60_000,
  });

  if (isLoading)
    return (
      <p className="text-muted-foreground px-1 py-6 text-center text-sm">이력을 불러오는 중...</p>
    );
  if (isError)
    return (
      <p className="text-destructive px-1 py-6 text-center text-sm">이력을 불러오지 못했습니다.</p>
    );
  return <PriceHistoryChart points={data?.points ?? []} />;
}

// 전국 평균 대비: 음수(더 저렴)면 초록, 양수면 회색(ROADMAP T-21 #2) — 색만으로 구분하지 않도록 부호와 원화도 그대로 표기한다.
function DiffCell({ diff }: { diff: number | null }) {
  if (diff == null) return <span className="text-muted-foreground">-</span>;
  if (diff === 0) return <span className="text-muted-foreground">평균과 동일</span>;
  const cheaper = diff < 0;
  return (
    <span className={cn('price', cheaper ? 'text-secondary' : 'text-muted-foreground')}>
      {cheaper ? '' : '+'}
      {formatPrice(diff)}
    </span>
  );
}

export function PharmacyDrugTable({
  pharmacyId,
  drugPrices,
}: {
  pharmacyId: number;
  drugPrices: DrugPrice[];
}) {
  const [expandedDrugId, setExpandedDrugId] = useState<number | null>(null);

  if (drugPrices.length === 0) {
    return (
      <p className="text-muted-foreground px-1 py-6 text-center text-sm">
        등록된 취급 약품이 없습니다.
      </p>
    );
  }

  return (
    <div className="bg-card border-border overflow-x-auto border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="px-3 py-2 font-medium whitespace-nowrap">약품</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">대표가격</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">제보 수</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">최근 갱신일</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">전국 평균 대비</th>
          </tr>
        </thead>
        <tbody>
          {drugPrices.map((drug) => {
            const expanded = expandedDrugId === drug.drugId;
            return (
              <Fragment key={drug.drugId}>
                <tr
                  className="hover:bg-muted/50 focus-visible:ring-ring/50 cursor-pointer border-b outline-none -outline-offset-2 last:border-b-0 focus-visible:ring-3"
                  onClick={() => setExpandedDrugId(expanded ? null : drug.drugId)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    setExpandedDrugId(expanded ? null : drug.drugId);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expanded}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {expanded ? (
                        <ChevronDown className="text-muted-foreground size-4 shrink-0" />
                      ) : (
                        <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                      )}
                      <div>
                        <span className="font-medium">{drug.displayName}</span>
                        <span className="text-muted-foreground ml-1.5 text-xs">
                          {drug.packageUnit}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="price px-3 py-2 font-semibold whitespace-nowrap">
                    {formatPrice(drug.repPrice)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{drug.reportCount}건</td>
                  <td className="px-3 py-2 whitespace-nowrap">{drug.lastReportedAt}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <DiffCell diff={drug.diffFromNationalAvg} />
                  </td>
                </tr>
                {expanded && (
                  <tr className={cn('bg-muted/20', 'border-b last:border-b-0')}>
                    <td colSpan={5} className="px-3 py-3">
                      <DrugHistoryRow pharmacyId={pharmacyId} drugId={drug.drugId} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
