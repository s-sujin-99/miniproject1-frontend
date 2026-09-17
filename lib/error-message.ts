import { ApiError } from '@/lib/api';

// ApiError.message는 보통 백엔드가 이미 한글로, 때로는 상황에 맞게 더 구체적으로 채워준다
// (예: 로그인 실패 시 AuthService가 UNAUTHENTICATED에 "이메일 또는 비밀번호가 올바르지 않습니다."를
// 직접 얹는다) — 이 경우는 code 기준 일반 문구보다 더 정확하므로 그대로 쓴다. 문제는 에러 응답이
// JSON이 아닌 경우(예: 프록시/서버가 죽어 있을 때)로, apiFetch가 res.statusText 같은 영문 원문으로
// 대체한다(lib/api.ts). 한글이 아니면(=백엔드가 채운 메시지가 아니면) code 기준 문구로 바꿔치기해
// 영문이 새어나갈 여지를 막는다(ROADMAP T-36 — "영문 에러 원문 노출 지점 0개").
const HANGUL_PATTERN = /[가-힣]/;

const CODE_MESSAGE: Record<string, string> = {
  VALIDATION_FAILED: '입력값을 다시 확인해주세요.',
  INVALID_COORDINATE: '위치 정보가 올바르지 않습니다.',
  INVALID_DATE_RANGE: '구매일이 올바르지 않습니다.',
  INVALID_RADIUS: '검색 반경이 올바르지 않습니다.',
  UNAUTHENTICATED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청하신 정보를 찾을 수 없습니다.',
  PHARMACY_NOT_FOUND: '약국 정보를 찾을 수 없습니다.',
  DRUG_NOT_FOUND: '약품 정보를 찾을 수 없습니다.',
  REPORT_NOT_FOUND: '제보를 찾을 수 없습니다.',
  EMAIL_ALREADY_EXISTS: '이미 가입된 이메일입니다.',
  DUPLICATE_REPORT: '오늘 이미 같은 약국·약품에 대한 제보가 있습니다.',
  FILE_TOO_LARGE: '파일 크기는 5MB를 초과할 수 없습니다.',
  UNSUPPORTED_FILE_TYPE: 'jpg/png/webp 이미지만 업로드할 수 있습니다.',
  DRUG_NOT_OTC: '일반의약품이 아닌 약품은 제보할 수 없습니다.',
  CONFLICT: '이미 존재하거나 처리 중인 요청입니다.',
};

const DEFAULT_MESSAGE = '문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
const NETWORK_MESSAGE = '네트워크 연결을 확인해주세요.';

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.message && HANGUL_PATTERN.test(error.message)) {
      return error.message;
    }
    return CODE_MESSAGE[error.code] ?? DEFAULT_MESSAGE;
  }
  if (error instanceof TypeError) {
    // fetch() 자체가 실패(오프라인, CORS, DNS 등)하면 TypeError를 던진다 — ApiError가 아니다.
    return NETWORK_MESSAGE;
  }
  return DEFAULT_MESSAGE;
}
