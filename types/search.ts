// API.md §5 GET /api/v1/search 응답. 손으로 정의 — openapi-typescript 파이프라인이 아직 없다.
export type LocationSource = 'GPS' | 'REGION';
export type SortOption = 'SCORE' | 'PRICE' | 'DISTANCE';
export type DataSourceType = 'SEED' | 'MIXED' | 'USER';
export type ResultBadge = 'LOWEST_PRICE' | 'LOW_CONFIDENCE' | 'STALE_DATA' | 'NEAREST';

export interface SearchDrugSummary {
  id: number;
  displayName: string;
  packageUnit: string;
  imageUrl: string | null;
}

export interface SearchQueryEcho {
  lat: number;
  lng: number;
  radius: number;
  sort: SortOption;
  locationSource: LocationSource;
}

export interface SearchSummary {
  resultCount: number;
  candidateAvgPrice: number | null;
  candidateMinPrice: number | null;
  candidateMaxPrice: number | null;
  maxSaving: number | null;
}

export interface PharmacySummary {
  id: number;
  name: string;
  addressRoad: string | null;
  lat: number;
  lng: number;
  phone: string | null;
}

export interface ScoreBreakdown {
  priceScore: number;
  distanceScore: number;
  freshnessScore: number;
  weights: { price: number; distance: number; freshness: number };
}

export interface PriceInfo {
  repPrice: number;
  minPrice: number;
  avgPrice: number;
  savingVsCandidateAvg: number;
  reportCount: number;
  lastReportedAt: string;
  daysSinceLastReport: number;
}

export interface SearchResultItem {
  rank: number;
  recommended: boolean;
  pharmacy: PharmacySummary;
  price: PriceInfo;
  distanceM: number;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  badges: ResultBadge[];
}

export interface SearchSuggestion {
  type: string;
  recommendedRadius: number;
  estimatedCount: number;
}

export interface SearchResponse {
  drug: SearchDrugSummary;
  query: SearchQueryEcho;
  summary: SearchSummary;
  dataSource: DataSourceType;
  results: SearchResultItem[];
  suggestion: SearchSuggestion | null;
}
