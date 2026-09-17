// shrimp-rules §4.2 백엔드 PageResponse<T>와 대응하는 목록 응답 래퍼.
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}
