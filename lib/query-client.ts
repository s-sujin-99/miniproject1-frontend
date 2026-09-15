import { QueryClient } from '@tanstack/react-query';

// 컴포넌트 리렌더마다 새로 만들면 캐시가 매번 사라지므로 factory로 분리
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
      },
    },
  });
}
