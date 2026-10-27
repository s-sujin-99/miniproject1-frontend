'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { formatPrice, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PageResponse } from '@/types/api';
import type { PriceReportListItem } from '@/types/report';

// 홈 화면의 "Works/Portfolio" 자리 — 실제 포트폴리오가 없는 서비스라, 방금 들어온 실거래가
// 제보를 갤러리처럼 보여준다. /api/v1/price-reports는 이미 공개 제공되는 목록이라 추가
// 백엔드 작업 없이 그대로 쓴다.
export function ReportGallery() {
  const { data } = useQuery({
    queryKey: ['price-reports', 'recent'],
    queryFn: () => apiFetch<PageResponse<PriceReportListItem>>('/api/v1/price-reports?size=8'),
    staleTime: 60 * 1000,
  });

  const reports = data?.content ?? [];
  if (reports.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <p className="text-accent-foreground font-mono text-xs tracking-[0.2em]">LIVE FEED</p>
      <h2 className="text-foreground mt-3 text-2xl font-black tracking-tight sm:text-3xl">
        방금 등록된 가격 제보
      </h2>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {reports.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: (i % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className={cn(i % 2 === 1 && 'sm:mt-10')}
          >
            <Link
              href={`/pharmacies/${r.pharmacy.id}`}
              className="bg-card ring-border hover:ring-primary/40 group block rounded-2xl p-5 shadow-[0_10px_26px_-18px_rgba(36,31,26,0.3)] ring-1 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-18px_rgba(255,85,0,0.35)]"
            >
              <span className="text-primary/15 group-hover:text-primary/35 font-mono text-4xl font-black transition-colors">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-foreground -mt-6 line-clamp-2 min-h-[2.5rem] text-sm font-semibold">
                {r.drug.displayName}
              </p>
              <p className="text-muted-foreground truncate text-xs">{r.pharmacy.name}</p>
              <p className="price text-primary mt-3 text-lg font-bold">{formatPrice(r.price)}</p>
              <p className="text-muted-foreground/70 text-[11px]">
                {formatRelativeTime(r.createdAt)}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
