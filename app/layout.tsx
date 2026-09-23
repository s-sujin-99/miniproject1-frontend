import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { Providers } from './providers';
import { LocationIndicator } from '@/components/location-indicator';
import { UserMenu } from '@/components/user-menu';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '약값알림',
  description: '약값 제보/조회 서비스',
};

const NOTICE_TEXT = '본 서비스의 가격은 학습용 예시 데이터입니다';

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <header className="bg-background border-border sticky top-0 z-20 border-b">
            <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-2 gap-y-1 px-6 py-4">
              <Link
                href="/"
                className="text-foreground shrink-0 text-xl font-black tracking-tight whitespace-nowrap"
              >
                약값알림
              </Link>
              <div className="flex shrink-0 items-center gap-3">
                <LocationIndicator />
                <UserMenu />
              </div>
            </div>
          </header>
          <main className="flex flex-1 flex-col">{children}</main>
          <footer className="border-border bg-background border-t">
            <div className="px-6 py-3">
              <p className="text-muted-foreground font-mono text-[0.7rem]">{NOTICE_TEXT}</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
