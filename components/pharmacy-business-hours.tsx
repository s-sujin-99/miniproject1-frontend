'use client';

import { Fragment, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BusinessHours } from '@/types/pharmacy';

const DAY_LABELS: Record<string, string> = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일',
  holiday: '공휴일',
};
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'];
// Date#getDay() 인덱스(0=일 ~ 6=토) 순서 그대로 — 오늘 요일을 찾는 용도라 뷰어의 로컬 시간을 쓴다.
const WEEKDAY_BY_GETDAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function formatRange(range: [string, string] | null | undefined) {
  return range ? `${range[0]} - ${range[1]}` : '휴무';
}

export function PharmacyBusinessHours({ hours }: { hours: BusinessHours }) {
  const [expanded, setExpanded] = useState(false);
  const todayKey = WEEKDAY_BY_GETDAY[new Date().getDay()];
  const hasToday = todayKey in hours;

  return (
    <div>
      <h2 className="mb-1 text-sm font-medium">영업시간</h2>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="hover:bg-muted -mx-2 flex w-full items-center justify-between px-2 py-1.5 text-sm transition-colors"
        aria-expanded={expanded}
      >
        <span>
          {hasToday ? (
            <>
              <span className="text-muted-foreground">오늘({DAY_LABELS[todayKey]})</span>{' '}
              <span className="font-medium">{formatRange(hours[todayKey])}</span>
            </>
          ) : (
            <span className="text-muted-foreground">영업시간 보기</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'text-muted-foreground size-4 transition-transform',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-2 text-sm">
          {DAY_ORDER.filter((day) => day in hours).map((day) => (
            <Fragment key={day}>
              <dt
                className={cn(
                  'text-muted-foreground',
                  day === todayKey && 'text-primary font-medium',
                )}
              >
                {DAY_LABELS[day]}
              </dt>
              <dd className={cn(day === todayKey && 'text-primary font-medium')}>
                {formatRange(hours[day])}
              </dd>
            </Fragment>
          ))}
        </dl>
      )}
    </div>
  );
}
