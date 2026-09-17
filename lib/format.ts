export function formatPrice(n: number): string {
  return `${new Intl.NumberFormat('ko-KR').format(n)}원`;
}

export function formatThousands(n: number): string {
  return new Intl.NumberFormat('ko-KR').format(n);
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}
