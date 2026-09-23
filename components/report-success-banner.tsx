'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, X } from 'lucide-react';

// ROADMAP T-29 — 제보 폼 제출 후 /pharmacies/{id}?reported=1 로 돌아왔을 때 보여주는 성공 배너.
// 별도 toast 인프라(ToastProvider 등) 없이 이 페이지 안에서만 쓰는 일회성 배너로 충분해 새로 만들지 않았다.
export function ReportSuccessBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  if (searchParams.get('reported') !== '1' || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    router.replace(pathname);
  }

  return (
    <div className="border-secondary/30 bg-secondary/5 text-secondary mb-4 flex items-center justify-between gap-2 border px-4 py-2.5 text-sm">
      <span className="flex items-center gap-1.5">
        <CheckCircle2 className="size-4 shrink-0" />
        제보해주셔서 감사합니다. 가격 정보가 반영되었습니다.
      </span>
      <button
        type="button"
        onClick={dismiss}
        className="hover:bg-secondary/10 shrink-0 p-1"
        aria-label="닫기"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
