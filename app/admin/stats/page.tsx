'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, BarChart3, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { DrugAutocomplete } from '@/components/drug-autocomplete';
import { DistributionHistogram } from '@/components/charts/distribution-histogram';
import { RegionAvgBarChart } from '@/components/charts/region-avg-bar-chart';
import { PriceGapBars } from '@/components/charts/price-gap-bars';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { formatPrice, formatThousands } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RegionGroup } from '@/types/region';
import type { DrugSummary } from '@/types/drug';
import type {
  AdminDrugStatsResponse,
  AdminPriceGapsResponse,
  AdminRegionStatRow,
  AdminRegionStatsResponse,
} from '@/types/admin';

const TABS = [
  { key: 'regions', label: '지역별 통계' },
  { key: 'drug', label: '약품별 분포' },
  { key: 'gaps', label: '가격 격차 Top10' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ROADMAP T-34 — /admin/stats. 3개 탭 모두 같은 페이지 안에서 클라이언트 상태로 전환한다
// (URL 동기화는 검증 기준에 없다).
export default function AdminStatsPage() {
  const [tab, setTab] = useState<TabKey>('regions');

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">가격 통계</h1>

      <div className="bg-muted mt-4 flex w-fit gap-1 rounded-full p-1 text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-full px-4 py-2 font-medium transition-colors',
              tab === t.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 제목/서브탭은 이 밖이라 스크롤에 안 딸려 올라간다. 높이는 admin/layout.tsx의 상한선(1123px)에서
          이 페이지 제목/서브탭 높이(실측 92px)를 뺀 값 — 탭 내용이 넘치면 이 영역 안에서만 스크롤된다. */}
      <div className="max-h-[1031px] overflow-y-auto">
        <div className="mt-6">
          {tab === 'regions' && <RegionStatsTab />}
          {tab === 'drug' && <DrugDistributionTab />}
          {tab === 'gaps' && <PriceGapsTab />}
        </div>
      </div>
    </div>
  );
}

type SortKey =
  'region' | 'drug' | 'avgPrice' | 'minPrice' | 'maxPrice' | 'pharmacyCount' | 'reportCount';

// 좁은 화면에서는 핵심 열(지역·약품·평균가)만 보이고, 나머지는 화면이 넓어질 때 순서대로 나타난다
// — 가로 스크롤 대신 열 자체를 반응형으로 줄인다.
const COLUMNS: { key: SortKey; label: string; responsive?: string }[] = [
  { key: 'region', label: '지역' },
  { key: 'drug', label: '약품' },
  { key: 'avgPrice', label: '평균가' },
  { key: 'minPrice', label: '최저가', responsive: 'hidden sm:table-cell' },
  { key: 'maxPrice', label: '최고가', responsive: 'hidden sm:table-cell' },
  { key: 'pharmacyCount', label: '약국수', responsive: 'hidden lg:table-cell' },
  { key: 'reportCount', label: '제보수', responsive: 'hidden lg:table-cell' },
];

const PAGE_SIZE = 10;

function sortValue(row: AdminRegionStatRow, key: SortKey): string | number {
  if (key === 'region') return `${row.region.sido} ${row.region.sigungu}`;
  if (key === 'drug') return row.drug?.displayName ?? '';
  return row[key];
}

function RegionStatsTab() {
  const [sido, setSido] = useState('');
  const [sigunguCode, setSigunguCode] = useState('');
  const [drug, setDrug] = useState<DrugSummary | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('avgPrice');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const { data: regionGroups } = useQuery({
    queryKey: ['regions'],
    queryFn: () => apiFetch<RegionGroup[]>('/api/v1/regions'),
    staleTime: 60 * 60 * 1000,
  });
  const sigungus = useMemo(
    () => regionGroups?.find((g) => g.sido === sido)?.sigungus ?? [],
    [regionGroups, sido],
  );

  const query = new URLSearchParams();
  if (sigunguCode) query.set('regionCode', sigunguCode);
  else if (sido) query.set('sido', sido);
  if (drug) query.set('drugId', String(drug.id));

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stats', 'regions', sido, sigunguCode, drug?.id],
    queryFn: () =>
      apiFetch<AdminRegionStatsResponse>(`/api/v1/admin/stats/regions?${query.toString()}`, {
        auth: true,
      }),
  });

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedRows = useMemo(() => {
    const rows = [...(data?.rows ?? [])];
    rows.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), 'ko');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [data, sortKey, sortDir]);

  // 필터·정렬이 바뀌면 목록 자체가 바뀌므로 1페이지로 되돌린다. drug-autocomplete.tsx와 같은
  // "렌더 중 상태 조정" 패턴 — effect가 아니라 렌더 단계에서 처리해 깜빡임 없이 반영된다.
  const filterKey = `${sido}|${sigunguCode}|${drug?.id ?? ''}|${sortKey}|${sortDir}`;
  const [pageResetKey, setPageResetKey] = useState(filterKey);
  if (pageResetKey !== filterKey) {
    setPageResetKey(filterKey);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const pagedRows = sortedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="bg-card flex flex-wrap items-center gap-2 rounded-2xl p-3 shadow-sm">
        <Select
          className="w-auto"
          value={sido}
          onChange={(e) => {
            setSido(e.target.value);
            setSigunguCode('');
          }}
        >
          <option value="">전체 시/도</option>
          {regionGroups?.map((g) => (
            <option key={g.sido} value={g.sido}>
              {g.sido}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto"
          value={sigunguCode}
          onChange={(e) => setSigunguCode(e.target.value)}
          disabled={!sido}
        >
          <option value="">전체 시/군/구</option>
          {sigungus.map((s) => (
            <option key={s.code} value={s.code}>
              {s.sigungu}
            </option>
          ))}
        </Select>
        {drug ? (
          <span className="bg-muted flex items-center gap-1.5 rounded-full py-1 pr-1 pl-3 text-xs">
            {drug.displayName}
            <button
              onClick={() => setDrug(null)}
              className="text-muted-foreground hover:text-foreground rounded-full p-1"
              aria-label="약품 필터 해제"
            >
              <X className="size-3" />
            </button>
          </span>
        ) : (
          <div className="w-56">
            <DrugAutocomplete placeholder="약품 필터 (선택)" onSelect={(d) => setDrug(d)} />
          </div>
        )}
      </div>

      {isError ? (
        <ErrorState title="통계를 불러오지 못했습니다" description="잠시 후 다시 시도해주세요." />
      ) : isLoading ? (
        <p className="text-muted-foreground mt-6 text-sm">불러오는 중...</p>
      ) : sortedRows.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">조건에 맞는 통계가 없습니다.</p>
      ) : (
        <>
          <div className="bg-card mt-4 overflow-x-auto rounded-2xl shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border bg-muted/50 border-b text-left">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={cn('px-3 py-2 font-medium whitespace-nowrap', col.responsive)}
                    >
                      <button
                        onClick={() => toggleSort(col.key)}
                        className="hover:text-foreground flex items-center gap-1"
                      >
                        {col.label}
                        {sortKey === col.key &&
                          (sortDir === 'asc' ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          ))}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {pagedRows.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/40">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.region.sido} {row.region.sigungu}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.drug?.displayName ?? '전체'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatPrice(row.avgPrice)}</td>
                    <td className="hidden px-3 py-2 whitespace-nowrap sm:table-cell">
                      {formatPrice(row.minPrice)}
                    </td>
                    <td className="hidden px-3 py-2 whitespace-nowrap sm:table-cell">
                      {formatPrice(row.maxPrice)}
                    </td>
                    <td className="hidden px-3 py-2 whitespace-nowrap lg:table-cell">
                      {formatThousands(row.pharmacyCount)}
                    </td>
                    <td className="hidden px-3 py-2 whitespace-nowrap lg:table-cell">
                      {formatThousands(row.reportCount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-center gap-3 text-sm">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="이전 페이지"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="다음 페이지"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DrugDistributionTab() {
  const [drug, setDrug] = useState<DrugSummary | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stats', 'drug', drug?.id],
    queryFn: () =>
      apiFetch<AdminDrugStatsResponse>(`/api/v1/admin/stats/drugs/${drug!.id}`, { auth: true }),
    enabled: drug !== null,
  });

  return (
    <div>
      {drug ? (
        <span className="bg-muted flex w-fit items-center gap-1.5 rounded-full py-1 pr-1 pl-3 text-sm">
          {drug.displayName}
          <button
            onClick={() => setDrug(null)}
            className="text-muted-foreground hover:text-foreground rounded-full p-1"
            aria-label="약품 선택 취소"
          >
            <X className="size-3" />
          </button>
        </span>
      ) : (
        <div className="w-72">
          <DrugAutocomplete
            placeholder="분포를 볼 약품을 검색하세요"
            onSelect={(d) => setDrug(d)}
          />
        </div>
      )}

      {!drug ? (
        <div className="border-border mt-4 flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed">
          <EmptyState
            icon={<BarChart3 className="text-muted-foreground size-10" />}
            title="약품을 선택하면 가격 분포가 표시됩니다"
            description="위 검색창에서 통계를 볼 약품을 찾아보세요."
          />
        </div>
      ) : isError ? (
        <div className="mt-4 flex min-h-[420px] items-center justify-center">
          <ErrorState title="분포를 불러오지 못했습니다" description="잠시 후 다시 시도해주세요." />
        </div>
      ) : isLoading || !data ? (
        <div className="border-border mt-4 flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed">
          <p className="text-muted-foreground text-sm">불러오는 중...</p>
        </div>
      ) : (
        <div className="bg-card mt-6 min-h-[420px] rounded-2xl p-5 shadow-sm">
          <p className="font-medium">
            {data.drug.displayName}{' '}
            <span className="text-muted-foreground text-sm">{data.drug.packageUnit}</span>
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            전국 평균 {formatPrice(data.national.avg)} · 중앙값 {formatPrice(data.national.median)}{' '}
            · 최저 {formatPrice(data.national.min)} · 최고 {formatPrice(data.national.max)} ·
            표준편차 {formatThousands(data.national.stdDev)}
          </p>

          <h2 className="mt-6 mb-2 text-sm font-medium">가격대별 분포</h2>
          <DistributionHistogram distribution={data.distribution} />

          <h2 className="mt-6 mb-2 text-sm font-medium">지역별 평균가</h2>
          <RegionAvgBarChart byRegion={data.byRegion} />
        </div>
      )}
    </div>
  );
}

function PriceGapsTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stats', 'price-gaps'],
    queryFn: () =>
      apiFetch<AdminPriceGapsResponse>('/api/v1/admin/stats/price-gaps?limit=10', { auth: true }),
  });

  if (isError) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <ErrorState
          title="가격 격차를 불러오지 못했습니다"
          description="잠시 후 다시 시도해주세요."
        />
      </div>
    );
  }
  if (isLoading || !data) {
    return (
      <div className="border-border flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed">
        <p className="text-muted-foreground text-sm">불러오는 중...</p>
      </div>
    );
  }
  return (
    <div className="bg-card min-h-[420px] rounded-2xl p-5 shadow-sm">
      <PriceGapBars rows={data.rows} />
    </div>
  );
}
