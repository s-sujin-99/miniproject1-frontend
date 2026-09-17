// API.md §8 관리자 API 응답. 손으로 정의 — openapi-typescript 파이프라인이 아직 없다(types/drug.ts와 동일한 사정).
export interface AdminOverviewResponse {
  totals: {
    pharmacyCount: number;
    drugCount: number;
    reportCount: number;
    userCount: number;
    coveredPairCount: number;
  };
  recentTrend: { date: string; reportCount: number }[];
  flaggedReportCount: number;
  coverageRate: number;
}

export type AdminFlagReason = 'OUTLIER_LOW' | 'OUTLIER_HIGH' | 'DUPLICATE' | 'MANUAL';

// GET /api/v1/admin/price-reports — 공개 목록(PriceReportListItem)과 달리 reporter에 id/email,
// flagReason·receiptFileId가 추가된다(API.md §8).
export interface AdminPriceReportListItem {
  id: number;
  pharmacy: { id: number; name: string };
  drug: { id: number; displayName: string; packageUnit: string };
  price: number;
  purchasedAt: string;
  reporter: { id: number; nickname: string; email: string } | null;
  source: 'FORM' | 'SEED';
  status: 'ACTIVE' | 'HIDDEN';
  flagged: boolean;
  flagReason: AdminFlagReason | null;
  receiptFileId: number | null;
  createdAt: string;
}

export interface AdminReportPatchResponse {
  id: number;
  status: 'ACTIVE' | 'HIDDEN';
  flagged: boolean;
  updatedAt: string;
  recalculatedStat: {
    pharmacyId: number;
    drugId: number;
    repPrice: number | null;
    reportCount: number;
  };
}

// GET /api/v1/admin/stats/regions (ROADMAP T-34, API.md §8)
export interface AdminRegionStatRow {
  region: { code: string; sido: string; sigungu: string };
  drug: { id: number; displayName: string } | null;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  pharmacyCount: number;
  reportCount: number;
}

export interface AdminRegionStatsResponse {
  rows: AdminRegionStatRow[];
}

// GET /api/v1/admin/stats/drugs/{drugId}
export interface AdminDrugStatsResponse {
  drug: { id: number; displayName: string; packageUnit: string };
  distribution: { bucketFrom: number; bucketTo: number; count: number }[];
  byRegion: { sido: string; sigungu: string; avgPrice: number; pharmacyCount: number }[];
  national: { avg: number; median: number; min: number; max: number; stdDev: number };
}

// GET /api/v1/admin/stats/price-gaps
export interface AdminPriceGapRow {
  drug: { id: number; displayName: string };
  cheapestRegion: { sido: string; sigungu: string; avgPrice: number };
  priciestRegion: { sido: string; sigungu: string; avgPrice: number };
  gap: number;
  gapPct: number;
}

export interface AdminPriceGapsResponse {
  rows: AdminPriceGapRow[];
}
