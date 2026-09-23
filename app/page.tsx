'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { MapPin, Receipt, Search } from 'lucide-react';
import { DrugAutocomplete } from '@/components/drug-autocomplete';
import { getResolvedCoordinates, useUserLocation } from '@/hooks/use-user-location';
import { cn } from '@/lib/utils';
import type { DrugSummary } from '@/types/drug';

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

const SPECS = ['전국 약국 대상', '회원가입 없이 검색', '실시간 가격 비교'];

const FEATURES = [
  {
    index: '01',
    icon: Search,
    title: '위치 기반 최저가 검색',
    description: '내 주변 약국의 실제 판매가를 한눈에 비교해요.',
  },
  {
    index: '02',
    icon: Receipt,
    title: '가격 제보',
    description: '방금 산 가격을 제보하면 다른 사람에게도 도움이 돼요.',
  },
  {
    index: '03',
    icon: MapPin,
    title: '약국 위치·영업시간',
    description: '지도와 영업시간까지 확인하고 헛걸음을 줄여요.',
  },
];

// 히어로 요소를 순서대로 살짝 밀어 올리며 나타나게 한다 — 로드 시 한 번만, 뿔뿔이 흩어진
// 마이크로 애니메이션 대신 하나의 정돈된 등장 시퀀스로 몰아준다.
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

  return (
    <div className="flex-1">
      <section className="grain border-border relative isolate overflow-hidden border-b">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 pt-14 pb-14 sm:pt-20 sm:pb-16 lg:grid-cols-12 lg:gap-x-10 lg:pt-24 lg:pb-20">
          <div className="lg:col-span-7">
            <motion.span
              custom={0}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="border-foreground text-foreground inline-block border px-3 py-1 font-mono text-xs font-bold tracking-[0.2em]"
            >
              PRICE INDEX
            </motion.span>

            <motion.h1
              custom={1}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="text-foreground mt-6 font-black tracking-tight"
            >
              <span className="block text-3xl leading-none sm:text-4xl">약 이름 하나로</span>
              <span className="mt-3 block text-6xl leading-[0.9] text-balance sm:text-7xl lg:text-8xl">
                오늘 가장 싼
                <br />
                <span className="bg-foreground text-background px-2">약국</span>을 찾다
              </span>
            </motion.h1>

            <motion.p
              custom={2}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="text-muted-foreground mt-6 max-w-md text-base sm:text-lg"
            >
              내 주변 약국의 실제 판매가를 비교해서 발품 없이 최저가로 사세요.
            </motion.p>

            <motion.div
              custom={3}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="border-foreground relative z-20 mt-8 max-w-xl border-2 p-4 sm:p-5"
            >
              <DrugAutocomplete
                key={quickQuery}
                onSelect={goToSearch}
                initialQuery={quickQuery}
                autoFocus
              />
              {pendingDrug && (
                <p className="text-muted-foreground mt-3 animate-pulse font-mono text-xs">
                  위치를 확인하는 중입니다...
                </p>
              )}
            </motion.div>
          </div>

          <motion.aside
            custom={2}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="lg:col-span-5 lg:mt-16"
          >
            <div className="border-border h-full border p-6 sm:p-8">
              <p className="text-muted-foreground font-mono text-xs tracking-[0.2em]">
                WHY 약값알림
              </p>
              <ul className="mt-4">
                {SPECS.map((spec, i) => (
                  <li
                    key={spec}
                    className="border-border flex items-center gap-3 border-t py-3 first:border-t-0 first:pt-0"
                  >
                    <span className="text-muted-foreground font-mono text-xs">0{i + 1}</span>
                    <span className="text-foreground text-sm font-medium">{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        </div>

        {/* "시세판" 티커 — 인기 약 이름이 흐르는 띠. 목록을 두 벌 이어붙여 -50%까지 옮기면 이음매
            없이 반복돼 보인다(globals.css의 @keyframes marquee). */}
        <div className="bg-foreground text-background border-border overflow-hidden border-t">
          <div className="animate-[marquee_32s_linear_infinite] motion-reduce:animate-none flex w-max gap-8 py-3 whitespace-nowrap hover:[animation-play-state:paused]">
            {[...POPULAR_DRUGS, ...POPULAR_DRUGS].map((name, i) => (
              <button
                key={`${name}-${i}`}
                type="button"
                onClick={() => setQuickQuery(name)}
                className="font-mono text-sm tracking-wide underline-offset-4 hover:underline"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.2em]">HOW IT WORKS</p>
        <h2 className="text-foreground mt-3 text-2xl font-black tracking-tight sm:text-3xl">
          이렇게 이용하세요
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {FEATURES.map(({ index, icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'relative overflow-hidden border p-6 sm:p-8',
                i === 1
                  ? 'bg-foreground text-background border-foreground lg:mt-10'
                  : 'border-border bg-card',
                i === 2 && 'lg:mt-4',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none absolute top-3 right-4 font-mono text-5xl font-black',
                  i === 1 ? 'text-background/15' : 'text-foreground/5',
                )}
              >
                {index}
              </span>
              <div
                className={cn(
                  'relative flex size-11 items-center justify-center',
                  i === 1 ? 'bg-background text-foreground' : 'bg-foreground text-background',
                )}
              >
                <Icon className="size-5" />
              </div>
              <h3 className="relative mt-5 font-semibold">{title}</h3>
              <p
                className={cn(
                  'relative mt-1.5 text-sm',
                  i === 1 ? 'text-background/70' : 'text-muted-foreground',
                )}
              >
                {description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
