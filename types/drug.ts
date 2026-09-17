// API.md §3 GET /api/v1/drugs 목록 응답 1건. 손으로 정의 — openapi-typescript 파이프라인이 아직 없다.
export interface DrugSummary {
  id: number;
  itemSeq: string | null;
  displayName: string;
  name: string;
  maker: string | null;
  category: string;
  form: string | null;
  packageUnit: string;
  imageUrl: string | null;
  nationalAvgPrice: number | null;
  pharmacyCount: number;
}
