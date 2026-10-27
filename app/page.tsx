'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { MapPin, Receipt, Search } from 'lucide-react';
import { DrugAutocomplete } from '@/components/drug-autocomplete';
import { ReportGallery } from '@/components/report-gallery';
import { getResolvedCoordinates, useUserLocation } from '@/hooks/use-user-location';
import type { DrugSummary } from '@/types/drug';

// WebGL 캔버스는 서버에 그릴 게 없다 — 클라이언트 전용으로 늦게 불러온다.
const HeroPillScene = dynamic(
  () => import('@/components/hero-pill-scene').then((m) => m.HeroPillScene),
  { ssr: false },
);

// ROADMAP T-17 — 실제 시드 데이터에 존재하는 이름만 골랐다(존재하지 않는 이름은 클릭해도 결과가 없다).
const POPULAR_DRUGS = [
  '타이레놀',
  '게보린',
  '판콜에이',
  '베아제',
  '부루펜',
  '챔프시럽',
  '훼스탈골드',
  '판피린큐',
];

const FEATURES = [
  {
    icon: Search,
    title: '위치 기반 최저가 검색',
    description: '내 주변 약국의 실제 판매가를 한눈에 비교해요.',
  },
  {
    icon: Receipt,
    title: '가격 제보',
    description: '방금 산 가격을 제보하면 다른 사람에게도 도움이 돼요.',
  },
  {
    icon: MapPin,
    title: '약국 위치·영업시간',
    description: '지도와 영업시간까지 확인하고 헛걸음을 줄여요.',
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Home() {
  const router = useRouter();
  const { state, isPickerOpen, requestLocation, openPicker } = useUserLocation();
  const [pendingDrug, setPendingDrug] = useState<DrugSummary | null>(null);
  const [quickQuery, setQuickQuery] = useState('');
  const heroRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  // 모바일 캡슐이 헤드라인/검색창/태그 블록과 겹치지 않으려면 그 블록이 실제로 어디서 끝나는지
  // 알아야 한다 — 고정 오프셋으로는 태그 줄바꿈 등에 따라 블록 높이가 달라질 때마다 다시 겹친다.
  const [textBottomFraction, setTextBottomFraction] = useState(0.62);

  function goToSearch(drug: DrugSummary) {
    const coords = getResolvedCoordinates(state);
    if (coords) {
      router.push(`/search?drugId=${drug.id}&lat=${coords.lat}&lng=${coords.lng}&radius=2000`);
      return;
    }
    // 위치가 아직 없으면 T-16 훅을 먼저 태우고, 위치가 정해지는 대로 아래 effect가 이동을 이어받는다.
    setPendingDrug(drug);
    if (state.status === 'idle') {
      requestLocation();
    } else if (state.status === 'denied' || state.status === 'unavailable') {
      openPicker();
    }
  }

  useEffect(() => {
    // router.push는 렌더 중에 호출할 수 없는 진짜 부수효과라 effect가 맞는 자리다.
    // setPendingDrug은 그 부수효과에 딸린 뒷정리일 뿐이라 별도 파생 상태로 뺄 수 없다.
    if (!pendingDrug) return;
    const coords = getResolvedCoordinates(state);
    if (coords) {
      router.push(
        `/search?drugId=${pendingDrug.id}&lat=${coords.lat}&lng=${coords.lng}&radius=2000`,
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect -- router.push 뒷정리
      setPendingDrug(null);
      return;
    }
    if (!isPickerOpen && (state.status === 'denied' || state.status === 'unavailable')) {
      // 사용자가 지역 선택 모달을 닫아버렸다 — 대기 중이던 이동을 취소한다.
      setPendingDrug(null);
    }
  }, [state, isPickerOpen, pendingDrug, router]);

  useEffect(() => {
    const hero = heroRef.current;
    const text = textRef.current;
    if (!hero || !text) return;
    const compute = () => {
      const heroRect = hero.getBoundingClientRect();
      const textRect = text.getBoundingClientRect();
      if (heroRect.height === 0) return;
      setTextBottomFraction((textRect.bottom - heroRect.top) / heroRect.height);
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(hero);
    observer.observe(text);
    return () => observer.disconnect();
  }, [pendingDrug]);

  return (
    <div className="bg-background flex-1">
      <section
        ref={heroRef}
        className="relative isolate min-h-[34rem] w-full overflow-hidden sm:min-h-[38rem] lg:min-h-[44rem]"
      >
        {/* 크림 배경 위 은은한 오렌지 글로우 — soijeong.com 레퍼런스의 "크림 바탕 + 채도 높은
            오렌지 블록" 톤. 딥블랙 무대가 아니라 밝고 따뜻한 매장 조명에 가깝다. */}
        <div
          className="pointer-events-none absolute inset-0 -z-20"
          style={{
            background:
              'radial-gradient(ellipse 65% 55% at 72% 40%, rgba(255,85,0,0.16), transparent 70%)',
          }}
        />
        <div className="absolute inset-0 -z-10">
          <HeroPillScene textBottomFraction={textBottomFraction} />
        </div>

        <div className="pointer-events-none mx-auto flex min-h-[34rem] max-w-7xl flex-col justify-center px-6 py-14 sm:min-h-[38rem] lg:min-h-[44rem]">
          <div ref={textRef} className="flex max-w-xl flex-col gap-5">
            <motion.span
              custom={0}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="bg-accent text-accent-foreground pointer-events-auto w-fit rounded-full px-3.5 py-1.5 font-mono text-xs font-bold tracking-[0.2em]"
            >
              PRICE INDEX
            </motion.span>

            <motion.h1
              custom={1}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="text-foreground text-4xl leading-[1.1] font-black tracking-tight text-balance sm:text-5xl lg:text-6xl"
            >
              약 이름 하나로
              <br />
              오늘 가장 싼{' '}
              <span className="bg-primary text-primary-foreground inline-block rounded-full px-3">
                약국
              </span>
              을 찾다
            </motion.h1>

            <motion.p
              custom={2}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="text-muted-foreground text-base sm:text-lg"
            >
              내 주변 약국의 실제 판매가를 비교해서 발품 없이 최저가로 사세요.
            </motion.p>

            {/* z-20: 자동완성 패널이 아래 칩 위에 그려지게 한다 */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="bg-card ring-border pointer-events-auto relative z-20 w-full rounded-full p-1.5 shadow-[0_16px_40px_-16px_rgba(36,31,26,0.25)] ring-1 [&_input]:h-12 [&_input]:rounded-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-foreground [&_input:focus-visible]:ring-[3px] [&_input:focus-visible]:ring-primary/40"
            >
              <DrugAutocomplete
                key={quickQuery}
                onSelect={goToSearch}
                initialQuery={quickQuery}
                autoFocus
              />
            </motion.div>

            <motion.div
              custom={4}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="pointer-events-auto relative flex w-full flex-wrap gap-2"
            >
              {POPULAR_DRUGS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setQuickQuery(name)}
                  className="border-border bg-card text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground rounded-full border px-3.5 py-1.5 font-mono text-sm transition-colors"
                >
                  {name}
                </button>
              ))}
            </motion.div>

            {pendingDrug && (
              <p className="price text-muted-foreground pointer-events-auto relative animate-pulse text-xs">
                위치를 확인하는 중입니다...
              </p>
            )}
          </div>
        </div>

        {/* 640px 미만은 캡슐 자체를 렌더링하지 않는다(hero-pill-scene.tsx) — 커서로 움직일
            대상이 없는데 이 문구만 떠 있으면 앞뒤가 안 맞아서 같은 기준으로 숨긴다. */}
        <p className="text-muted-foreground absolute right-4 bottom-4 hidden font-mono text-[0.7rem] tracking-wide sm:right-6 sm:bottom-6 sm:block">
          (마우스를 움직여보세요)
        </p>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <p className="text-accent-foreground font-mono text-xs tracking-[0.2em]">HOW IT WORKS</p>
        <h2 className="text-foreground mt-3 text-2xl font-black tracking-tight sm:text-3xl">
          이렇게 이용하세요
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, scale: 1.02 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card ring-border rounded-3xl p-6 shadow-[0_12px_30px_-18px_rgba(36,31,26,0.3)] ring-1 transition-shadow hover:shadow-[0_20px_40px_-16px_rgba(255,85,0,0.35)] sm:p-7"
            >
              <div className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-full">
                <Icon className="size-5" />
              </div>
              <h3 className="text-foreground mt-5 font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-1.5 text-sm">{description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <ReportGallery />
    </div>
  );
}
