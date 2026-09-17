'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ErrorPanel } from '@/components/error-panel';
import { EmptyState } from '@/components/empty-state';
import { apiFetch, getStoredToken } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import type { PageResponse } from '@/types/api';
import type {
  AdminFlagReason,
  AdminPriceReportListItem,
  AdminReportPatchResponse,
} from '@/types/admin';

const FLAG_REASON_LABEL: Record<AdminFlagReason, string> = {
  OUTLIER_LOW: '낮은 가격 이상치',
  OUTLIER_HIGH: '높은 가격 이상치',
  DUPLICATE: '중복 제보',
  MANUAL: '관리자 수동 지정',
};

// GET /api/v1/uploads/{fileId}는 인증이 필요한 바이너리 응답이라 <img src>에 URL을 직접 못 넣는다
// (API.md §6). fetch로 blob을 받아 object URL로 변환한다.
function ReceiptThumbnail({ fileId }: { fileId: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    const token = getStoredToken();
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/uploads/${fileId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => (res.ok ? res.blob() : Promise.reject(res)))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  if (!url) return <div className="bg-muted size-10 shrink-0 rounded" />;
  // eslint-disable-next-line @next/next/no-img-element -- 인증이 필요한 blob URL이라 next/image 최적화 대상이 아니다
  return <img src={url} alt="영수증" className="size-10 shrink-0 rounded object-cover" />;
}

interface PendingAction {
  report: AdminPriceReportListItem;
  nextStatus: 'HIDDEN' | 'ACTIVE';
}

// ROADMAP T-33 — /admin/reports. window.confirm 대신 모달로 숨김/복구를 확인한다(#2 지침).
// 기본으로 flagged=true만 보여준다 — "이상치 제보 관리"라는 화면 목적에 맞춘 필터.
export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingAction | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'price-reports', 'flagged'],
    queryFn: () =>
      apiFetch<PageResponse<AdminPriceReportListItem>>(
        '/api/v1/admin/price-reports?flagged=true&size=50',
        { auth: true },
      ),
  });

  const patchMutation = useMutation({
    mutationFn: (input: { id: number; status: 'HIDDEN' | 'ACTIVE' }) =>
      apiFetch<AdminReportPatchResponse>(`/api/v1/admin/price-reports/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        auth: true,
        body: JSON.stringify({ status: input.status }),
      }),
    onSuccess: () => {
      // 목록과 대시보드 KPI(이상치 제보 수·커버리지) 둘 다 즉시 갱신한다 — 검증 기준의 핵심.
      queryClient.invalidateQueries({ queryKey: ['admin', 'price-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats', 'overview'] });
      setPending(null);
    },
  });

  if (isError) {
    return (
      <ErrorPanel
        title="제보 목록을 불러오지 못했습니다"
        description="잠시 후 다시 시도해주세요."
      />
    );
  }

  const reports = data?.content ?? [];

  return (
    <div>
      <h1 className="text-xl font-semibold">이상치 제보 관리</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">
        가격 통계에서 이상치로 표시된 제보입니다. 확인 후 숨기거나 복구할 수 있습니다.
      </p>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">불러오는 중...</p>
      ) : reports.length === 0 ? (
        <EmptyState title="이상치로 표시된 제보가 없습니다" />
      ) : (
        <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
          {reports.map((report) => (
            <li key={report.id} className="flex items-center gap-3 px-4 py-3">
              {report.receiptFileId ? (
                <ReceiptThumbnail fileId={report.receiptFileId} />
              ) : (
                <div className="bg-muted size-10 shrink-0 rounded" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {report.pharmacy.name} · {report.drug.displayName}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {formatPrice(report.price)} · {report.purchasedAt} ·{' '}
                  {report.reporter
                    ? `${report.reporter.nickname} (${report.reporter.email})`
                    : '익명'}
                </p>
                {report.flagReason && (
                  <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                    {FLAG_REASON_LABEL[report.flagReason]}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                {report.status === 'HIDDEN' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPending({ report, nextStatus: 'ACTIVE' })}
                  >
                    복구
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setPending({ report, nextStatus: 'HIDDEN' })}
                  >
                    숨김
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogTitle>
            {pending?.nextStatus === 'HIDDEN'
              ? '제보를 숨기시겠습니까?'
              : '제보를 복구하시겠습니까?'}
          </DialogTitle>
          <DialogDescription>
            {pending?.report.pharmacy.name} · {pending?.report.drug.displayName} ·{' '}
            {pending && formatPrice(pending.report.price)}
            {pending?.nextStatus === 'HIDDEN'
              ? ' — 숨기면 통계에서 즉시 제외됩니다.'
              : ' — 복구하면 통계에 즉시 다시 반영됩니다.'}
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPending(null)}>
              취소
            </Button>
            <Button
              size="sm"
              disabled={patchMutation.isPending}
              onClick={() =>
                pending &&
                patchMutation.mutate({ id: pending.report.id, status: pending.nextStatus })
              }
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
