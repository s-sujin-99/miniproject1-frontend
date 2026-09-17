import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/error-state';

// 서버 컴포넌트에서 API 호출이 실패했을 때 쓰는 전체 페이지 에러 화면. search/pharmacies 상세가 공유한다.
export function ErrorPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <ErrorState title={title} description={description} />
      <div className="mt-4 flex justify-center">
        <Button asChild>
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    </div>
  );
}
