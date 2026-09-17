// API.md §6 POST /api/v1/uploads 응답. 손으로 정의(openapi-typescript 파이프라인 없음).
export interface UploadResponse {
  id: number;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}
