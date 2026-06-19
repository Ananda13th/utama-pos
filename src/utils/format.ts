export function formatCurrency(value: number): string {
  return 'Rp ' + Math.round(value).toLocaleString('id-ID');
}

export function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
}

export function calculateProfit(
  finalPrice: number,
  basePrice: number,
  quantity: number
): number {
  return (finalPrice - basePrice) * quantity;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function dayRange(dateStr: string): { from: string; to: string } {
  const from = new Date(`${dateStr}T00:00:00`);
  const to = new Date(`${dateStr}T23:59:59.999`);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function monthRange(monthStr: string): { from: string; to: string } {
  const [y, m] = monthStr.split('-').map(Number);
  const from = new Date(y, m - 1, 1, 0, 0, 0);
  const to = new Date(y, m, 0, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}
