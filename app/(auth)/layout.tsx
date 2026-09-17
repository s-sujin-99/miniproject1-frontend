// 로그인/회원가입이 공유하는 중앙 정렬 카드 레이아웃.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">{children}</div>;
}
