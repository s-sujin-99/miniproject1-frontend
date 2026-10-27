import Link from 'next/link';

// 로그인/회원가입이 공유하는 중앙 정렬 카드 레이아웃.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
      {/* 홈 히어로와 같은 오렌지 글로우 — 페이지가 바뀌어도 같은 "무대 조명" 톤을 유지한다. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 55% 50% at 50% 0%, rgba(255,85,0,0.16), transparent 70%)',
        }}
      />
      <div className="bg-card ring-primary/15 flex w-full max-w-sm flex-col gap-6 rounded-3xl px-6 py-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ring-1 sm:px-8">
        <Link
          href="/"
          className="text-muted-foreground hover:text-primary w-fit font-mono text-xs tracking-[0.2em] transition-colors"
        >
          ← 약값알림
        </Link>
        {children}
      </div>
    </div>
  );
}
