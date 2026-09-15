'use client';

import { Button } from '@/components/ui/button';

const ELLIPSIS = '…' as const;
type PageItem = number | typeof ELLIPSIS;

// current/total은 1-base. 예: buildPageList(5, 20) -> [1, '…', 4, 5, 6, '…', 20]
export function buildPageList(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...items].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: PageItem[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) result.push(ELLIPSIS);
    result.push(page);
  });
  return result;
}

interface PaginationProps {
  page: number; // 0-base
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = page + 1; // 1-base로 변환해 표시
  const pageList = buildPageList(current, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="페이지네이션">
      <Button
        variant="outline"
        size="icon-sm"
        disabled={current <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="이전 페이지"
      >
        ‹
      </Button>
      {pageList.map((item, i) =>
        item === ELLIPSIS ? (
          <span key={`ellipsis-${i}`} className="text-muted-foreground px-1 text-sm">
            {ELLIPSIS}
          </span>
        ) : (
          <Button
            key={item}
            variant={item === current ? 'default' : 'outline'}
            size="icon-sm"
            onClick={() => onPageChange(item - 1)}
            aria-current={item === current ? 'page' : undefined}
          >
            {item}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="icon-sm"
        disabled={current >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="다음 페이지"
      >
        ›
      </Button>
    </nav>
  );
}
