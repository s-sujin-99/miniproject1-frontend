// API.md §7 GET /api/v1/regions 응답. 손으로 정의 — openapi-typescript 파이프라인이 아직 없다.
export interface RegionSigungu {
  code: string;
  sigungu: string;
  centerLat: number;
  centerLng: number;
  pharmacyCount: number;
}

export interface RegionGroup {
  sido: string;
  sigungus: RegionSigungu[];
}
