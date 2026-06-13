// Helper format & kalkulasi yang dipakai lintas fitur

// Format angka ke Rupiah, mis. 1500000 -> "Rp 1.500.000"
export function formatRupiah(value: number): string {
  return 'Rp ' + Math.round(value).toLocaleString('id-ID');
}

// Format angka biasa dengan pemisah ribuan
export function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
}

// Profit per transaksi = (harga jual - harga pokok) * qty
export function calculateProfit(
  finalPrice: number,
  basePrice: number,
  quantity: number
): number {
  return (finalPrice - basePrice) * quantity;
}

// Format ISO datetime -> "10 Jun 2026, 14:30"
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

// Rentang awal–akhir hari untuk satu tanggal (YYYY-MM-DD) dalam ISO
export function dayRange(dateStr: string): { from: string; to: string } {
  const from = new Date(`${dateStr}T00:00:00`);
  const to = new Date(`${dateStr}T23:59:59.999`);
  return { from: from.toISOString(), to: to.toISOString() };
}

// Rentang awal–akhir bulan untuk "YYYY-MM" dalam ISO
export function monthRange(monthStr: string): { from: string; to: string } {
  const [y, m] = monthStr.split('-').map(Number);
  const from = new Date(y, m - 1, 1, 0, 0, 0);
  const to = new Date(y, m, 0, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}
