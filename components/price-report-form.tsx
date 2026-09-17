'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { DrugAutocomplete } from '@/components/drug-autocomplete';
import { PharmacyPicker } from '@/components/pharmacy-picker';
import { ApiError, apiFetch } from '@/lib/api';
import { formatThousands } from '@/lib/format';
import type { DrugSummary } from '@/types/drug';
import type { PharmacyDetail } from '@/types/pharmacy';
import type {
  PharmacyPickResult,
  PriceReportCreateRequest,
  PriceReportCreateResponse,
} from '@/types/report';
import type { UploadResponse } from '@/types/upload';

const MAX_PAST_DAYS = 180;
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function minPurchasedAtIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - MAX_PAST_DAYS);
  return d.toISOString().slice(0, 10);
}

// API.md §6 요청 스키마(가격 100~200000, 구매일 오늘~180일 이전, 메모 200자)를 그대로 반영한다.
const formSchema = z.object({
  price: z
    .string()
    .min(1, '가격을 입력해주세요')
    .transform((v) => v.replaceAll(',', ''))
    .refine((v) => /^-?\d+$/.test(v), '숫자만 입력해주세요')
    .transform((v) => Number(v))
    .refine((n) => n >= 100, '100원 이상 입력해주세요')
    .refine((n) => n <= 200000, '200,000원 이하로 입력해주세요'),
  purchasedAt: z
    .string()
    .refine(
      (v) => v >= minPurchasedAtIso() && v <= todayIso(),
      '구매일은 오늘부터 180일 이전 사이여야 합니다',
    ),
  memo: z.string().max(200, '메모는 200자 이내로 입력해주세요').optional(),
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

interface PriceReportFormProps {
  initialPharmacyId?: number;
}

export function PriceReportForm({ initialPharmacyId }: PriceReportFormProps) {
  const router = useRouter();
  const [pharmacy, setPharmacy] = useState<PharmacyPickResult | null>(null);
  const [pharmacyError, setPharmacyError] = useState<string | null>(null);
  const [drug, setDrug] = useState<DrugSummary | null>(null);
  const [drugError, setDrugError] = useState<string | null>(null);
  const [receiptFileId, setReceiptFileId] = useState<number | undefined>(undefined);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [warning, setWarning] = useState<{ message: string; pharmacyId: number } | null>(null);

  const { data: prefillPharmacy } = useQuery({
    queryKey: ['pharmacy', initialPharmacyId],
    queryFn: () => apiFetch<PharmacyDetail>(`/api/v1/pharmacies/${initialPharmacyId}`),
    enabled: initialPharmacyId != null,
    staleTime: 60_000,
  });

  // ?pharmacyId= 쿼리로 진입했을 때 1회만 약국을 미리 채운다(약국상세 → 제보 폼 이동, ROADMAP T-29).
  useEffect(() => {
    if (!prefillPharmacy) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- react-query(외부 상태) 응답을 로컬 폼 상태로 1회 반영
    setPharmacy({
      id: prefillPharmacy.id,
      name: prefillPharmacy.name,
      addressRoad: prefillPharmacy.addressRoad,
      lat: prefillPharmacy.lat,
      lng: prefillPharmacy.lng,
      phone: prefillPharmacy.phone,
      distanceM: prefillPharmacy.distanceM,
    });
  }, [prefillPharmacy]);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: { price: '', purchasedAt: todayIso(), memo: '' },
  });

  async function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_RECEIPT_BYTES) {
      setUploadError('5MB 이하 이미지만 업로드할 수 있습니다.');
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('purpose', 'RECEIPT');
      const res = await apiFetch<UploadResponse>('/api/v1/uploads', {
        method: 'POST',
        auth: true,
        body,
      });
      setReceiptFileId(res.id);
      setReceiptFileName(file.name);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : '영수증 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  }

  function removeReceipt() {
    setReceiptFileId(undefined);
    setReceiptFileName(null);
    setUploadError(null);
  }

  async function onSubmit(values: FormOutput) {
    setServerError(null);
    const hasPharmacy = pharmacy != null;
    const hasDrug = drug != null;
    setPharmacyError(hasPharmacy ? null : '약국을 선택해주세요');
    setDrugError(hasDrug ? null : '약품을 선택해주세요');
    if (!hasPharmacy || !hasDrug) return;

    const payload: PriceReportCreateRequest = {
      pharmacyId: pharmacy.id,
      drugId: drug.id,
      price: values.price,
      purchasedAt: values.purchasedAt,
      receiptFileId,
      memo: values.memo || undefined,
    };

    try {
      const res = await apiFetch<PriceReportCreateResponse>('/api/v1/price-reports', {
        method: 'POST',
        auth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.flagged) {
        setWarning({
          message:
            res.warning ??
            '입력하신 가격이 일반적인 가격대와 크게 달라 통계에는 반영되지 않았습니다.',
          pharmacyId: res.pharmacyId,
        });
      } else {
        router.push(`/pharmacies/${res.pharmacyId}?reported=1`);
      }
    } catch (e) {
      setServerError(
        e instanceof ApiError ? e.message : '제보에 실패했습니다. 잠시 후 다시 시도해주세요.',
      );
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">약국</label>
          <PharmacyPicker
            value={pharmacy}
            onChange={(p) => {
              setPharmacy(p);
              if (p) setPharmacyError(null);
            }}
          />
          {pharmacyError && <p className="text-destructive text-xs">{pharmacyError}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">약품</label>
          {drug ? (
            <div className="border-input bg-muted/30 flex items-center justify-between gap-2 rounded-lg border px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{drug.displayName}</p>
                <p className="text-muted-foreground truncate text-xs">{drug.packageUnit}</p>
              </div>
              <button
                type="button"
                onClick={() => setDrug(null)}
                className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1"
                aria-label="약품 선택 취소"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <DrugAutocomplete
              onSelect={(d) => {
                setDrug(d);
                setDrugError(null);
              }}
            />
          )}
          {drugError && <p className="text-destructive text-xs">{drugError}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="price" className="text-sm font-medium">
            가격
          </label>
          <Controller
            control={control}
            name="price"
            render={({ field }) => (
              <div className="relative">
                <input
                  id="price"
                  type="text"
                  inputMode="numeric"
                  placeholder="예: 2,800"
                  aria-invalid={!!errors.price}
                  className="border-input bg-background focus-visible:ring-ring/50 h-11 w-full rounded-lg border px-4 pr-8 text-sm outline-none focus-visible:ring-3 aria-invalid:border-destructive"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(e) => {
                    // 숫자와 선행 부호만 남기고 나머지(글자 등)는 지워 천단위 콤마로 즉시 되보여준다.
                    const cleaned = e.target.value.replace(/[^0-9-]/g, '');
                    const negative = cleaned.startsWith('-');
                    const digits = cleaned.replace(/-/g, '');
                    field.onChange(
                      (negative ? '-' : '') + (digits ? formatThousands(Number(digits)) : ''),
                    );
                  }}
                />
                <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm">
                  원
                </span>
              </div>
            )}
          />
          {errors.price && <p className="text-destructive text-xs">{errors.price.message}</p>}
        </div>

        <details className="border-border rounded-lg border">
          <summary className="text-muted-foreground flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm font-medium select-none [&::-webkit-details-marker]:hidden">
            구매일 · 영수증 · 메모 (선택)
            <ChevronDown className="size-4" />
          </summary>

          <div className="flex flex-col gap-4 border-t px-4 py-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="purchasedAt" className="text-sm font-medium">
                구매일
              </label>
              <input
                id="purchasedAt"
                type="date"
                min={minPurchasedAtIso()}
                max={todayIso()}
                aria-invalid={!!errors.purchasedAt}
                className="border-input bg-background focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-3 aria-invalid:border-destructive"
                {...register('purchasedAt')}
              />
              {errors.purchasedAt && (
                <p className="text-destructive text-xs">{errors.purchasedAt.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">영수증 사진</span>
              {receiptFileName ? (
                <div className="border-input bg-muted/30 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Paperclip className="text-muted-foreground size-3.5 shrink-0" />
                    <span className="truncate">{receiptFileName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={removeReceipt}
                    className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1"
                    aria-label="영수증 제거"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={handleReceiptChange}
                  className="text-muted-foreground text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-secondary-foreground"
                />
              )}
              {uploading && <p className="text-muted-foreground text-xs">업로드 중...</p>}
              {uploadError && <p className="text-destructive text-xs">{uploadError}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="memo" className="text-sm font-medium">
                메모
              </label>
              <textarea
                id="memo"
                rows={2}
                maxLength={200}
                placeholder="예: 1+1 행사 아님, 정가"
                className="border-input bg-background focus-visible:ring-ring/50 resize-none rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3"
                {...register('memo')}
              />
              {errors.memo && <p className="text-destructive text-xs">{errors.memo.message}</p>}
            </div>
          </div>
        </details>

        {serverError && <p className="text-destructive text-sm">{serverError}</p>}

        <Button type="submit" size="lg" disabled={isSubmitting || uploading}>
          {isSubmitting ? '제보하는 중...' : '가격 제보하기'}
        </Button>
      </form>

      <Dialog
        open={warning != null}
        onOpenChange={(open) => {
          if (!open && warning) router.push(`/pharmacies/${warning.pharmacyId}?reported=1`);
        }}
      >
        <DialogContent>
          <DialogTitle>제보가 접수되었습니다</DialogTitle>
          <DialogDescription>{warning?.message}</DialogDescription>
          <Button
            className="mt-4 w-full"
            onClick={() => warning && router.push(`/pharmacies/${warning.pharmacyId}?reported=1`)}
          >
            확인
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
