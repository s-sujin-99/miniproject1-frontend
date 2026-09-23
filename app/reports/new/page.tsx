import { PriceReportForm } from '@/components/price-report-form';

// ROADMAP T-29 — 30초 안에 끝나는 단일 페이지 제보 폼. 비로그인 접근은 proxy.ts가 /login으로 보낸다.
export default async function NewPriceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ pharmacyId?: string }>;
}) {
  const params = await searchParams;
  const pharmacyId = params.pharmacyId ? Number(params.pharmacyId) : undefined;

  return (
    <div className="bg-background flex-1">
      <div className="border-foreground mx-auto max-w-md border-2 px-5 py-8 sm:my-10 sm:px-8">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.2em]">PRICE REPORT</p>
        <h1 className="text-foreground mt-1 text-3xl font-black tracking-tight">가격 제보하기</h1>
        <p className="text-muted-foreground mt-1 mb-6 text-sm">
          약국에서 확인한 실제 판매가를 알려주세요.
        </p>
        <PriceReportForm
          initialPharmacyId={pharmacyId && Number.isFinite(pharmacyId) ? pharmacyId : undefined}
        />
      </div>
    </div>
  );
}
