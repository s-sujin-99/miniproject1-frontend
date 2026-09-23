import Link from 'next/link';

// 로그인/회원가입이 공유하는 중앙 정렬 카드 레이아웃.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex flex-1 items-center justify-center px-4 py-10">
      <div className="border-foreground flex w-full max-w-sm flex-col gap-6 border-2 px-6 py-10 sm:px-8">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground w-fit font-mono text-xs tracking-[0.2em] transition-colors"
        >
          ← 약값알림
        </Link>
        {children}
      </div>
    </div>
  );
}
