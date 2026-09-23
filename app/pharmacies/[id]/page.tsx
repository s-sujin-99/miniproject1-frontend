import { Suspense } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorPanel } from '@/components/error-panel';
import { PharmacyBusinessHours } from '@/components/pharmacy-business-hours';
import { PharmacyDrugTable } from '@/components/pharmacy-drug-table';
import { ReportSuccessBanner } from '@/components/report-success-banner';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import { formatDistance } from '@/lib/format';
import type { PharmacyDetail } from '@/types/pharmacy';

// ROADMAP T-21 — 약국 상세 + 가격 이력. drugPrices 정렬(repPrice 오름차순)은 백엔드(T-19)가 보장한다.
export default async function PharmacyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pharmacyId = Number(id);
  if (!Number.isInteger(pharmacyId) || pharmacyId <= 0) {
    return <ErrorPanel title="잘못된 약국입니다" description="약국 정보를 찾을 수 없습니다." />;
  }

  let pharmacy: PharmacyDetail;
  try {
    pharmacy = await apiFetch<PharmacyDetail>(`/api/v1/pharmacies/${pharmacyId}`, {
      cache: 'no-store',
    });
  } catch (e) {
    return <ErrorPanel title="약국 정보를 불러오지 못했습니다" description={getErrorMessage(e)} />;
  }

  const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(pharmacy.name)},${pharmacy.lat},${pharmacy.lng}`;

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <Suspense>
          <ReportSuccessBanner />
        </Suspense>

        <div className="lg:grid lg:grid-cols-[320px_1fr] lg:items-start lg:gap-6">
          <div className="border-border bg-card mb-6 border p-5 lg:sticky lg:top-20 lg:mb-0 sm:p-6">
            {pharmacy.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 외부 사진 출처 도메인이 아직 정해지지 않아 next/image remotePatterns를 걸 수 없다.
              <img
                src={pharmacy.photoUrl}
                alt={`${pharmacy.name} 대표 사진`}
                className="border-border mb-4 h-40 w-full border object-cover"
              />
            ) : (
              <div className="bg-muted text-muted-foreground border-border mb-4 flex h-40 w-full items-center justify-center border">
                <Store className="size-10" aria-hidden />
              </div>
            )}

            <h1 className="text-foreground text-2xl font-black tracking-tight">{pharmacy.name}</h1>
            {pharmacy.addressRoad && (
              <p className="text-muted-foreground mt-1 text-sm">{pharmacy.addressRoad}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {pharmacy.phone && (
                <a
                  href={`tel:${pharmacy.phone}`}
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  <Phone className="size-4" /> {pharmacy.phone}
                </a>
              )}
              {pharmacy.distanceM != null && (
                <span className="text-muted-foreground">{formatDistance(pharmacy.distanceM)}</span>
              )}
              <a
                href={kakaoMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                <MapPin className="size-4" /> 길찾기
              </a>
            </div>

            {pharmacy.businessHours && (
              <div className="mt-4">
                <PharmacyBusinessHours hours={pharmacy.businessHours} />
              </div>
            )}

            <Button asChild className="mt-4 w-full">
              <Link href={`/reports/new?pharmacyId=${pharmacy.id}`}>이 약국에 가격 제보하기</Link>
            </Button>
          </div>

          <div className="min-w-0">
            <p className="text-muted-foreground font-mono text-xs tracking-[0.2em]">PRICE LIST</p>
            <h2 className="text-foreground mt-1 mb-4 text-xl font-black tracking-tight">
              취급 약품 가격
            </h2>
            <PharmacyDrugTable pharmacyId={pharmacy.id} drugPrices={pharmacy.drugPrices} />
          </div>
        </div>
      </div>
    </div>
  );
}
