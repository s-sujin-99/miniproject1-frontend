// API.md §4 GET /api/v1/pharmacies/{pharmacyId}, .../history 응답. 손으로 정의(openapi-typescript 파이프라인 없음).
export interface PharmacyRegion {
  code: string;
  sido: string;
  sigungu: string;
}

export type BusinessHours = Record<string, [string, string] | null>;

export interface DrugPrice {
  drugId: number;
  displayName: string;
  packageUnit: string;
  repPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  reportCount: number;
  lastReportedAt: string;
  nationalAvgPrice: number | null;
  diffFromNationalAvg: number | null;
}

export interface PharmacyDetail {
  id: number;
  name: string;
  addressRoad: string | null;
  addressJibun: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  businessHours: BusinessHours | null;
  distanceM: number | null;
  region: PharmacyRegion | null;
  drugPrices: DrugPrice[];
}

export interface PricePoint {
  purchasedAt: string;
  price: number;
  flagged: boolean;
}

export interface PriceHistory {
  pharmacyId: number;
  drugId: number;
  points: PricePoint[];
}
