import { Fragment, Suspense } from 'react';
import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorPanel } from '@/components/error-panel';
import { PharmacyDrugTable } from '@/components/pharmacy-drug-table';
import { ReportSuccessBanner } from '@/components/report-success-banner';
import { ApiError, apiFetch } from '@/lib/api';
import { formatDistance } from '@/lib/format';
import type { BusinessHours, PharmacyDetail } from '@/types/pharmacy';

const DAY_LABELS: Record<string, string> = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일',
  holiday: '공휴일',
};
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'];

function BusinessHoursList({ hours }: { hours: BusinessHours }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      {DAY_ORDER.filter((day) => day in hours).map((day) => {
        const range = hours[day];
        return (
          <Fragment key={day}>
            <dt className="text-muted-foreground">{DAY_LABELS[day]}</dt>
            <dd>{range ? `${range[0]} - ${range[1]}` : '휴무'}</dd>
          </Fragment>
        );
      })}
    </dl>
  );
}

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
    const message = e instanceof ApiError ? e.message : '약국 정보를 불러오지 못했습니다.';
    return <ErrorPanel title="약국 정보를 불러오지 못했습니다" description={message} />;
  }

  const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(pharmacy.name)},${pharmacy.lat},${pharmacy.lng}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Suspense>
        <ReportSuccessBanner />
      </Suspense>

      <div className="mb-6">
        <h1 className="text-xl font-semibold">{pharmacy.name}</h1>
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
            <h2 className="mb-1 text-sm font-medium">영업시간</h2>
            <BusinessHoursList hours={pharmacy.businessHours} />
          </div>
        )}

        <Button asChild className="mt-4">
          <Link href={`/reports/new?pharmacyId=${pharmacy.id}`}>이 약국에 가격 제보하기</Link>
        </Button>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">취급 약품 가격</h2>
        <PharmacyDrugTable pharmacyId={pharmacy.id} drugPrices={pharmacy.drugPrices} />
      </div>
    </div>
  );
}
