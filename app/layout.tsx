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
          <header className="border-b">
            <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <Link href="/" className="text-lg font-semibold">
                  약값알림
                </Link>
                <div className="flex items-center gap-3">
                  <LocationIndicator />
                  <UserMenu />
                </div>
              </div>
              <p className="text-muted-foreground text-xs">{NOTICE_TEXT}</p>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t">
            <div className="mx-auto max-w-5xl px-4 py-3">
              <p className="text-muted-foreground text-xs">{NOTICE_TEXT}</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
