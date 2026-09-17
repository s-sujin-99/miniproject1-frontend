'use client';

import { useEffect, useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { PageResponse } from '@/types/api';
import type { DrugSummary } from '@/types/drug';

interface DrugAutocompleteProps {
  onSelect: (drug: DrugSummary) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** 인기 약품 칩 클릭처럼 바깥에서 검색어를 미리 채워야 할 때 쓴다(마운트 시 1회만 반영). */
  initialQuery?: string;
}

// ROADMAP T-17 — 입력마다 호출하면 서버가 시끄러워 300ms 디바운스로 묶는다.
const DEBOUNCE_MS = 300;

export function DrugAutocomplete({
  onSelect,
  placeholder = '약 이름을 입력하세요 (예: 타이레놀)',
  autoFocus,
  initialQuery = '',
}: DrugAutocompleteProps) {
  const listboxId = useId();
  const [inputValue, setInputValue] = useState(initialQuery);
  const [debouncedValue, setDebouncedValue] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(initialQuery.trim().length > 0);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(inputValue.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data, isFetching } = useQuery({
    queryKey: ['drugs', 'autocomplete', debouncedValue],
    queryFn: () =>
      apiFetch<PageResponse<DrugSummary>>(
        `/api/v1/drugs?q=${encodeURIComponent(debouncedValue)}&size=8`,
      ),
    enabled: debouncedValue.length > 0,
    staleTime: 30_000,
  });

  const options = debouncedValue.length > 0 ? (data?.content ?? []) : [];
  const isDebouncePending = inputValue.trim() !== debouncedValue;
  const isLoading = debouncedValue.length > 0 && (isDebouncePending || isFetching);

  // 새 검색어의 결과가 오면 활성 옵션을 리셋한다. 렌더 중 상태를 조정하는 React 공식 패턴
  // (effect가 아니라 렌더 단계에서 처리해 깜빡임 없이 같은 커밋에서 반영된다).
  const [activeIndexResetKey, setActiveIndexResetKey] = useState(debouncedValue);
  if (activeIndexResetKey !== debouncedValue) {
    setActiveIndexResetKey(debouncedValue);
    setActiveIndex(-1);
  }

  function selectOption(drug: DrugSummary) {
    onSelect(drug);
    setInputValue('');
    setDebouncedValue('');
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return;
    // Escape는 결과가 0건(빈 상태 메시지만 떠 있음)이어도 항상 패널을 닫을 수 있어야 한다.
    if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (options.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        selectOption(options[activeIndex]);
      }
    }
  }

  const showPanel = isOpen && inputValue.trim().length > 0;
  const activeOption = activeIndex >= 0 ? options[activeIndex] : undefined;

  return (
    <div className="relative w-full">
      <input
        type="text"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listboxId}
        aria-activedescendant={activeOption ? `${listboxId}-option-${activeOption.id}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        autoFocus={autoFocus}
        className="border-input bg-background focus-visible:ring-ring/50 h-12 w-full rounded-lg border px-4 text-base outline-none focus-visible:ring-3"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
      />

      {showPanel && (
        <ul
          id={listboxId}
          role="listbox"
          className="bg-popover text-popover-foreground border-border absolute z-10 mt-1 w-full overflow-hidden rounded-lg border shadow-lg"
        >
          {isLoading ? (
            <li className="text-muted-foreground px-4 py-3 text-sm">검색 중...</li>
          ) : options.length === 0 ? (
            <li className="text-muted-foreground px-4 py-3 text-sm">검색 결과가 없습니다.</li>
          ) : (
            options.map((drug, index) => (
              <li
                key={drug.id}
                id={`${listboxId}-option-${drug.id}`}
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  'cursor-pointer px-4 py-2.5 text-sm',
                  index === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOption(drug)}
              >
                <span className="font-medium">{drug.displayName}</span>
                <span className="text-muted-foreground ml-1.5">{drug.packageUnit}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
