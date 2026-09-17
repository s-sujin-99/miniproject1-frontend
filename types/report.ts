// API.md §6 POST /api/v1/price-reports 요청/응답. 손으로 정의(openapi-typescript 파이프라인 없음).
export interface PriceReportCreateRequest {
  pharmacyId: number;
  drugId: number;
  price: number;
  purchasedAt?: string;
  receiptFileId?: number;
  memo?: string;
}

export interface UpdatedPriceStat {
  repPrice: number;
  minPrice: number;
  avgPrice: number;
  reportCount: number;
  lastReportedAt: string;
}

export type FlagReason = 'OUTLIER_LOW' | 'OUTLIER_HIGH';

export interface PriceReportCreateResponse {
  id: number;
  pharmacyId: number;
  drugId: number;
  price: number;
  purchasedAt: string;
  status: 'ACTIVE' | 'HIDDEN';
  flagged: boolean;
  flagReason: FlagReason | null;
  createdAt: string;
  warning: string | null;
  updatedStat: UpdatedPriceStat | null;
}

// PharmacyController /api/v1/pharmacies 검색 결과 1건(약국 선택용 — 검색 결과와 필드가 다르다).
export interface PharmacyPickResult {
  id: number;
  name: string;
  addressRoad: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  distanceM: number | null;
}

export type ReportStatus = 'ACTIVE' | 'HIDDEN';

// API.md §6 GET /api/v1/price-reports 목록 항목(ROADMAP T-28/T-30).
export interface PriceReportListItem {
  id: number;
  pharmacy: { id: number; name: string };
  drug: { id: number; displayName: string; packageUnit: string };
  price: number;
  purchasedAt: string;
  reporter: { nickname: string } | null;
  source: 'FORM' | 'SEED';
  status: ReportStatus;
  flagged: boolean;
  hasReceipt: boolean;
  createdAt: string;
}
