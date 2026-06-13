import { describe, it, expect } from 'vitest';
import { formatRupiah, calculateProfit, monthRange } from './format';

describe('formatRupiah', () => {
  it('memformat angka ke Rupiah dengan pemisah ribuan', () => {
    expect(formatRupiah(1500000)).toBe('Rp 1.500.000');
  });
  it('membulatkan desimal', () => {
    expect(formatRupiah(1000.6)).toBe('Rp 1.001');
  });
});

describe('calculateProfit', () => {
  it('menghitung profit positif', () => {
    expect(calculateProfit(200000, 150000, 2)).toBe(100000);
  });
  it('menghasilkan negatif jika jual di bawah pokok', () => {
    expect(calculateProfit(100000, 150000, 1)).toBe(-50000);
  });
});

describe('monthRange', () => {
  it('mengembalikan awal dan akhir bulan', () => {
    const { from, to } = monthRange('2026-06');
    expect(new Date(from).getDate()).toBe(1);
    expect(new Date(to).getMonth()).toBe(5); // Juni = index 5
  });
});
